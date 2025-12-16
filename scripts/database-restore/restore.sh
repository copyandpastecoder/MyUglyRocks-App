#!/bin/bash
#
# MyUglyRocks Database Restore Script (Linux/Mac)
#
# This script restores the PostgreSQL database from an R2 backup.
# Use this when the API/Hangfire is down and you cannot restore via Admin panel.
#
# Prerequisites (ALL required):
#   - Wrangler CLI: npm install -g wrangler
#   - PostgreSQL client: apt-get install postgresql-client (or brew install postgresql)
#   - Python 3: apt-get install python3 (or brew install python3)
#     * REQUIRED for URL parsing - handles special characters in passwords (@ : % etc.)
#     * Simple bash parsing breaks on these characters
#   - Wrangler authenticated: wrangler login
#
# Usage:
#   ./restore.sh                     # List available backups
#   ./restore.sh <backup-key>        # Restore specific backup (creates safety backup first)
#   ./restore.sh --no-safety <key>   # Restore without creating safety backup
#
# Environment variables:
#   DATABASE_URL  - PostgreSQL connection URL (required)
#   R2_BUCKET     - R2 backup bucket name (default: myuglyrocks-media-backup)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BUCKET="${R2_BUCKET:-myuglyrocks-media-backup}"
TEMP_DIR="/tmp/myuglyrocks-restore"

echo -e "${GREEN}========================================"
echo "  MyUglyRocks Database Restore"
echo -e "========================================${NC}"
echo ""

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || { echo -e "${RED}Error: wrangler CLI not found. Install with: npm install -g wrangler${NC}"; exit 1; }
command -v pg_restore >/dev/null 2>&1 || { echo -e "${RED}Error: pg_restore not found. Install postgresql-client${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Error: python3 not found. Install python3${NC}"; exit 1; }

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable not set${NC}"
    echo "Set it with: export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    exit 1
fi

# Parse DATABASE_URL using Python (handles special chars in password)
parse_url() {
    python3 << 'PYEOF'
import os
import sys
from urllib.parse import urlparse, unquote

url = os.environ.get('DATABASE_URL', '')
try:
    parsed = urlparse(url)
    # URL decode the password to handle special characters
    password = unquote(parsed.password) if parsed.password else ''
    print(f"{parsed.hostname or 'localhost'}")
    print(f"{parsed.port or 5432}")
    print(f"{parsed.path.lstrip('/') or 'postgres'}")
    print(f"{parsed.username or 'postgres'}")
    print(f"{password}")
    # Check for SSL mode in query params
    if 'sslmode' in (parsed.query or ''):
        print("require")
    else:
        print("")
except Exception as e:
    print(f"Error parsing URL: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF
}

# Parse the URL
URL_PARTS=$(parse_url)
PGHOST=$(echo "$URL_PARTS" | sed -n '1p')
PGPORT=$(echo "$URL_PARTS" | sed -n '2p')
PGDATABASE=$(echo "$URL_PARTS" | sed -n '3p')
PGUSER=$(echo "$URL_PARTS" | sed -n '4p')
PGPASSWORD=$(echo "$URL_PARTS" | sed -n '5p')
PGSSLMODE=$(echo "$URL_PARTS" | sed -n '6p')

export PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD
[ -n "$PGSSLMODE" ] && export PGSSLMODE

echo -e "Database: ${GREEN}$PGDATABASE${NC} @ ${GREEN}$PGHOST:$PGPORT${NC}"
echo ""

# Function to list backups
list_backups() {
    echo -e "${YELLOW}Available backups in $BUCKET:${NC}"
    echo ""

    for prefix in daily/ weekly/ monthly/ manual/ pre-restore/; do
        echo -e "${GREEN}=== ${prefix%/} ===${NC}"
        wrangler r2 object list "$BUCKET" --prefix="$prefix" 2>/dev/null | \
            grep -E '^\s*"key":' | \
            sed 's/.*"key": "\([^"]*\)".*/\1/' | \
            head -10 || echo "  (none)"
        echo ""
    done
}

# Function to create safety backup
create_safety_backup() {
    local timestamp=$(date -u +%Y-%m-%d_%H-%M-%S)
    local filename="pre-restore/cli-safety_${timestamp}.dump"
    local tempfile="$TEMP_DIR/safety_backup.dump"

    echo -e "${YELLOW}Creating safety backup before restore...${NC}"
    mkdir -p "$TEMP_DIR"

    pg_dump -Fc -Z5 --no-owner --no-acl -f "$tempfile" 2>&1 || {
        echo -e "${RED}Failed to create safety backup${NC}"
        return 1
    }

    echo "Uploading safety backup to R2..."
    wrangler r2 object put "$BUCKET/$filename" --file="$tempfile" 2>&1 || {
        echo -e "${RED}Failed to upload safety backup${NC}"
        rm -f "$tempfile"
        return 1
    }

    rm -f "$tempfile"
    echo -e "${GREEN}Safety backup created: $filename${NC}"
    echo ""
}

# Function to restore backup
restore_backup() {
    local backup_key="$1"
    local tempfile="$TEMP_DIR/restore.dump"

    echo -e "${YELLOW}Downloading backup: $backup_key${NC}"
    mkdir -p "$TEMP_DIR"

    wrangler r2 object get "$BUCKET/$backup_key" --file="$tempfile" 2>&1 || {
        echo -e "${RED}Failed to download backup${NC}"
        exit 1
    }

    echo -e "${YELLOW}Restoring database...${NC}"
    echo -e "${RED}WARNING: This will REPLACE ALL DATA in $PGDATABASE${NC}"
    echo ""

    pg_restore --clean --if-exists --single-transaction --no-owner --no-acl \
        -d "$PGDATABASE" "$tempfile" 2>&1 || {
        echo -e "${RED}pg_restore failed. Check the error messages above.${NC}"
        rm -f "$tempfile"
        exit 1
    }

    rm -f "$tempfile"
    echo ""
    echo -e "${GREEN}========================================"
    echo "  Restore completed successfully!"
    echo -e "========================================${NC}"
}

# Main logic
if [ $# -eq 0 ]; then
    list_backups
    echo ""
    echo "To restore a backup, run:"
    echo "  $0 <backup-key>"
    echo ""
    echo "Example:"
    echo "  $0 daily/myuglyrocks_2025-01-01_04-00-00.dump"
    exit 0
fi

NO_SAFETY=false
BACKUP_KEY=""

while [ $# -gt 0 ]; do
    case "$1" in
        --no-safety)
            NO_SAFETY=true
            shift
            ;;
        *)
            BACKUP_KEY="$1"
            shift
            ;;
    esac
done

if [ -z "$BACKUP_KEY" ]; then
    echo -e "${RED}Error: No backup key specified${NC}"
    exit 1
fi

echo -e "${RED}========================================"
echo "  WARNING: DATABASE RESTORE"
echo "========================================"
echo ""
echo "You are about to restore:"
echo "  Backup: $BACKUP_KEY"
echo "  Database: $PGDATABASE @ $PGHOST"
echo ""
echo "This will REPLACE ALL DATA in the database!"
echo -e "========================================${NC}"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""

# Create safety backup unless --no-safety
if [ "$NO_SAFETY" = false ]; then
    create_safety_backup || exit 1
fi

# Perform restore
restore_backup "$BACKUP_KEY"

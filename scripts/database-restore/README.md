# MyUglyRocks Database Restore Scripts

These scripts allow you to restore the PostgreSQL database from R2 backups when the API/Hangfire is unavailable.

## When to Use

Use these scripts when:
- The API pod is down/crashing and you cannot access the Admin panel
- Hangfire is not running and scheduled jobs aren't executing
- You need to restore from a backup on a fresh deployment

## Prerequisites

### All Platforms
1. **Wrangler CLI** - Cloudflare's CLI tool for R2 access
   ```bash
   npm install -g wrangler
   wrangler login  # Authenticate with Cloudflare
   ```

### Linux/Mac
1. **PostgreSQL client** (includes pg_dump, pg_restore)
   ```bash
   # Ubuntu/Debian
   apt-get install postgresql-client

   # macOS
   brew install postgresql
   ```

2. **Python 3** (for URL parsing with special characters)
   ```bash
   # Usually pre-installed on modern Linux/Mac
   python3 --version
   ```

### Windows
1. **PostgreSQL client** - Download from https://www.postgresql.org/download/windows/
   - During installation, select "Command Line Tools"
   - Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

## Configuration

### Required: Database URL

Set the `DATABASE_URL` environment variable with your PostgreSQL connection string:

### Linux/Mac
```bash
export DATABASE_URL="postgresql://postgres:password@hostname:5432/myuglyrocks?sslmode=require"
```

### Windows (PowerShell)
```powershell
$env:DATABASE_URL = "postgresql://postgres:password@hostname:5432/myuglyrocks?sslmode=require"
```

### Railway
Get your connection string from Railway dashboard:
1. Go to your PostgreSQL service
2. Click "Connect"
3. Copy the "DATABASE_URL" value

**Note:** Passwords with special characters (@ : % etc.) are automatically handled by the scripts.

### Optional: Backup Decryption Password

If your backups are encrypted (recommended), set the `BACKUP_PASSWORD` environment variable:

```bash
# Linux/Mac
export BACKUP_PASSWORD="your-backup-encryption-password"

# Windows (PowerShell)
$env:BACKUP_PASSWORD = "your-backup-encryption-password"
```

The scripts automatically detect if a backup is encrypted and will:
- Prompt for the password if encrypted but not set
- Skip decryption if the backup is not encrypted

**Note:** The encryption uses AES-256-CBC with PBKDF2 key derivation (OpenSSL-compatible format).

## Usage

### List Available Backups

```bash
# Linux/Mac
./restore.sh

# Windows
.\restore.ps1
```

### Restore a Backup

```bash
# Linux/Mac
./restore.sh daily/myuglyrocks_2025-01-01_04-00-00.dump

# Windows
.\restore.ps1 -BackupKey "daily/myuglyrocks_2025-01-01_04-00-00.dump"
```

The script will:
1. Create a safety backup first (pre-restore/cli-safety_timestamp.dump)
2. Download the specified backup from R2
3. Restore using pg_restore with --clean --single-transaction

### Skip Safety Backup (Not Recommended)

```bash
# Linux/Mac
./restore.sh --no-safety daily/myuglyrocks_2025-01-01_04-00-00.dump

# Windows
.\restore.ps1 -BackupKey "daily/myuglyrocks_2025-01-01_04-00-00.dump" -NoSafety
```

## Backup Organization

Backups are stored in R2 with this structure:

```
myuglyrocks-media-backup/
├── daily/          # Daily backups (30 day retention)
├── weekly/         # Weekly backups (180 day retention)
├── monthly/        # Monthly backups (kept indefinitely)
├── manual/         # Admin-triggered backups
└── pre-restore/    # Safety backups created before restore
```

## Troubleshooting

### "wrangler: command not found"
Install wrangler: `npm install -g wrangler`

### "pg_restore: command not found"
Install PostgreSQL client tools for your platform.

### "Failed to download backup"
- Verify the backup key exists: run the script without arguments to list backups
- Check wrangler authentication: `wrangler whoami`

### "SSL connection required"
Add `?sslmode=require` to your DATABASE_URL.

### "permission denied"
Ensure your database user has sufficient privileges (should be database owner).

## Security

- Never commit DATABASE_URL or credentials to version control
- The scripts use environment variables to avoid exposing passwords in process listings
- Safety backups ensure you can recover if the restore fails

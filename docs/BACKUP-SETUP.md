# Database Backup System Setup Guide

This guide walks you through setting up automated PostgreSQL backups to Cloudflare R2.

## Overview

The backup system provides:
- **Automated daily backups** at 4 AM UTC via Hangfire
- **Weekly validation** of backup integrity (Sunday 5 AM UTC)
- **Manual backup/restore** via Admin panel API endpoints
- **Retention policy**: 7 daily, 4 weekly, 3 monthly (minimum)
- **Fallback CLI scripts** for emergency restore when API is down

---

## Step 1: Create R2 Backup Bucket

### 1.1 Create the Bucket in Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Click **Create bucket**
3. Name it `myuglyrocks-media-backup` (or your preferred name)
4. **Location**: Choose the same region as your main bucket
5. **Public access**: Leave **disabled** (backups should be private)

### 1.2 Create API Token for Backup Bucket

You can use your existing R2 API token if it has access to both buckets, or create a dedicated token:

1. Go to R2 → **Manage R2 API Tokens**
2. Click **Create API token**
3. **Permissions**: Object Read & Write
4. **Specify buckets**: Select your backup bucket (`myuglyrocks-media-backup`)
5. **TTL**: No expiration (or set based on your security policy)
6. Click **Create**
7. **Copy the Access Key ID and Secret Access Key** (shown only once!)

> **Note**: If using a separate token for backups, you'll need to update the code to use different credentials. The current implementation shares the same R2 credentials for both buckets.

---

## Step 2: Update K8s Secret

### 2.1 Option A: Update Existing Secret

If you already have `myuglyrocks-api-secrets`, patch it to add the backup bucket name:

```bash
# First, delete and recreate with all values (kubectl doesn't support patching secrets easily)
kubectl delete secret myuglyrocks-api-secrets -n myuglyrocks

kubectl create secret generic myuglyrocks-api-secrets -n myuglyrocks \
  --from-literal=db-connection-string="YOUR_EXISTING_DB_CONNECTION" \
  --from-literal=redis-connection-string="YOUR_EXISTING_REDIS_CONNECTION" \
  --from-literal=jwt-secret="YOUR_EXISTING_JWT_SECRET" \
  --from-literal=r2-account-id="YOUR_R2_ACCOUNT_ID" \
  --from-literal=r2-access-key-id="YOUR_R2_ACCESS_KEY_ID" \
  --from-literal=r2-secret-access-key="YOUR_R2_SECRET_ACCESS_KEY" \
  --from-literal=r2-bucket-name="YOUR_MEDIA_BUCKET_NAME" \
  --from-literal=r2-public-url="YOUR_R2_PUBLIC_URL" \
  --from-literal=r2-backup-bucket-name="myuglyrocks-media-backup" \
  --from-literal=resend-api-key="YOUR_RESEND_API_KEY"
```

### 2.2 Option B: Get Current Values First

```bash
# Export current secret values to a file (base64 encoded)
kubectl get secret myuglyrocks-api-secrets -n myuglyrocks -o yaml > /tmp/secret-backup.yaml

# View current values (decode base64)
kubectl get secret myuglyrocks-api-secrets -n myuglyrocks -o jsonpath='{.data.db-connection-string}' | base64 -d
kubectl get secret myuglyrocks-api-secrets -n myuglyrocks -o jsonpath='{.data.r2-bucket-name}' | base64 -d
# ... etc for each value you need
```

Then recreate using the values from above.

---

## Step 3: Apply K8s Deployment Changes

The `api-deployment.yaml` needs the new volume mount mapping. If you pulled the latest code:

```bash
kubectl apply -f k8s/base/api-deployment.yaml
```

Or if you need to manually add the mapping, add this line to the secrets volume items:

```yaml
- key: r2-backup-bucket-name
  path: R2__BackupBucketName
```

---

## Step 4: Rebuild and Deploy API

The API Docker image needs `postgresql-client` for pg_dump/pg_restore:

```powershell
# Option 1: Use the restart script (recommended)
.\scripts\restart-apps.ps1 -SkipWeb

# Option 2: Manual rebuild
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks
kubectl rollout status deployment myuglyrocks-api -n myuglyrocks
```

---

## Step 5: Verify Configuration

### 5.1 Check Pod Logs for Backup Jobs

```bash
# Check that backup jobs are registered
kubectl logs -l app=myuglyrocks-api -n myuglyrocks | grep -i backup

# You should see:
# "Database backup jobs configured (daily at 4 AM UTC, validation weekly at 5 AM UTC)"
```

If you see `"R2:BackupBucketName not configured, database backup jobs disabled"`, the secret isn't being read correctly.

### 5.2 Check Hangfire Dashboard

1. Go to `https://dev.myuglyrocks.com/hangfire` (requires Admin login)
2. Click **Recurring Jobs**
3. You should see:
   - `database-backup` - Cron: `0 4 * * *` (daily 4 AM UTC)
   - `backup-validation` - Cron: `0 5 * * 0` (Sunday 5 AM UTC)

### 5.3 Test Manual Backup via API

```bash
# Get an admin JWT token first, then:
curl -X POST https://dev.myuglyrocks.com/api/admin/backups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "r2Key": "manual/myuglyrocks_2025-01-15_12-30-00.dump",
#   "sizeBytes": 1234567,
#   "duration": "00:00:05.123",
#   "checksum": "abc123...",
#   "errorMessage": null
# }
```

### 5.4 Verify Backup in R2

```bash
# Using wrangler CLI
wrangler r2 object list myuglyrocks-media-backup --prefix="manual/"

# Or check in Cloudflare Dashboard → R2 → myuglyrocks-media-backup
```

---

## API Endpoints Reference

All endpoints require Admin role authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/backups` | List all backups (limit=50) |
| `GET` | `/api/admin/backups/latest` | Get most recent backup info |
| `POST` | `/api/admin/backups` | Create manual backup |
| `POST` | `/api/admin/backups/validate` | Validate backup integrity |
| `POST` | `/api/admin/backups/restore` | Restore from backup |

### Validate Request Body

```json
{
  "backupKey": "daily/myuglyrocks_2025-01-15_04-00-00.dump"
}
```

### Restore Request Body

```json
{
  "backupKey": "daily/myuglyrocks_2025-01-15_04-00-00.dump",
  "confirmation": "RESTORE"
}
```

---

## Backup Schedule & Retention

| Type | Schedule | Retention | Minimum Kept |
|------|----------|-----------|--------------|
| Daily | 4 AM UTC | 30 days | 7 |
| Weekly | Sundays | 180 days | 4 |
| Monthly | 1st of month | Forever | 3 |
| Manual | On-demand | Forever | N/A |
| Pre-restore | Before restore | Forever | N/A |

### Folder Structure in R2

```
myuglyrocks-media-backup/
├── daily/              # Daily 4 AM backups
├── weekly/             # Sunday backups
├── monthly/            # 1st of month backups
├── manual/             # Admin-triggered backups
└── pre-restore/        # Safety backups before restore
```

---

## Emergency Restore (When API is Down)

If the API pod is crashing and you can't access the Admin panel, use the CLI scripts:

### Prerequisites

```bash
# Install wrangler CLI
npm install -g wrangler
wrangler login

# Install PostgreSQL client
# Ubuntu: apt-get install postgresql-client
# macOS: brew install postgresql
# Windows: Download from postgresql.org

# Set DATABASE_URL (get from Railway dashboard)
export DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
```

### Linux/Mac

```bash
cd scripts/database-restore

# List available backups
./restore.sh

# Restore specific backup
./restore.sh daily/myuglyrocks_2025-01-15_04-00-00.dump
```

### Windows

```powershell
cd scripts\database-restore

# List available backups
.\restore.ps1

# Restore specific backup
.\restore.ps1 -BackupKey "daily/myuglyrocks_2025-01-15_04-00-00.dump"
```

---

## Troubleshooting

### "R2:BackupBucketName not configured"

1. Check secret exists: `kubectl get secret myuglyrocks-api-secrets -n myuglyrocks`
2. Check secret has the key: `kubectl get secret myuglyrocks-api-secrets -n myuglyrocks -o yaml | grep backup`
3. Check deployment has the volume mount mapping
4. Restart the pod: `kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks`

### "pg_dump: command not found"

The Docker image wasn't rebuilt with `postgresql-client`:
```bash
docker build --no-cache -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
```

### "Access Denied" when uploading to R2

1. Verify R2 API token has write access to the backup bucket
2. Check the token hasn't expired
3. Verify bucket name in secret matches actual R2 bucket name

### Backup job not running

1. Check Hangfire dashboard for job status
2. Check API logs for errors: `kubectl logs -l app=myuglyrocks-api -n myuglyrocks --tail=100`
3. Trigger manually via API to test

---

## Configuration Reference

### appsettings.json

```json
{
  "R2": {
    "AccountId": "from-secret",
    "AccessKeyId": "from-secret",
    "SecretAccessKey": "from-secret",
    "BucketName": "from-secret",
    "PublicUrl": "from-secret",
    "BackupBucketName": "from-secret"
  }
}
```

### Environment Variables (via K8s secret mount)

| Secret Key | Config Path | Description |
|------------|-------------|-------------|
| `r2-backup-bucket-name` | `R2__BackupBucketName` | R2 bucket for backups |

---

## Security Considerations

- Backup bucket is **private** (no public access)
- Backups contain **hashed passwords** (not plaintext)
- Pre-restore safety backup created automatically
- CLI scripts use environment variables (not command-line passwords)
- R2 provides encryption at rest (SSE)
- All API operations require Admin role

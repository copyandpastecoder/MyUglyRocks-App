# MyUglyRocks - Production Release Guide

Complete step-by-step instructions for deploying MyUglyRocks to production on Railway.

---

## CRITICAL: Code Changes Required Before Deployment

Your app is currently configured for Kubernetes (local dev). Railway is different - you need code changes.

### Issue 1: Database Connection String Format

**Problem:** Railway provides `DATABASE_URL` in PostgreSQL URL format:
```
postgresql://user:password@host:port/database
```

But your app expects .NET format via `ConnectionStrings:DefaultConnection`:
```
Host=xxx;Database=xxx;Username=xxx;Password=xxx
```

**Solution: Set connection string directly in Railway (Recommended)**

Set the environment variable in Railway with the full .NET connection string format:
```
ConnectionStrings__DefaultConnection=Host=xxx.railway.internal;Database=railway;Username=postgres;Password=xxx;SSL Mode=Require;Trust Server Certificate=true
```

ASP.NET Core automatically reads `ConnectionStrings__DefaultConnection` as `ConnectionStrings:DefaultConnection` - no code changes needed.

Get the host/password values from Railway's PostgreSQL service variables and construct the .NET format yourself.

> **Note:** Railway auto-generates `DATABASE_URL` in URL format, but you can ignore it and set your own connection string directly. This keeps the same pattern as dev (K8s secrets) with no parsing code required.

---

### Issue 2: Redis Connection String Format

**Problem:** Railway provides `REDIS_URL` in URL format:
```
redis://default:password@host:port
```

But your app expects StackExchange.Redis format via `ConnectionStrings:Redis`:
```
host:port,password=xxx
```

**Solution: Set connection string directly in Railway (Recommended)**

Set the environment variable in Railway with the StackExchange.Redis format:
```
ConnectionStrings__Redis=xxx.railway.internal:6379,password=xxx
```

Get the host/password values from Railway's Redis service variables. No code changes needed.

---

### Note: Secrets Loading (No Action Required)

Your app loads secrets from `/etc/secrets/` (K8s volume mounts) but falls back to environment variables automatically. On Railway, `/etc/secrets` doesn't exist, so it uses env vars. No changes needed.

---

### Note: CORS and AllowedHosts (No Action Required)

Production domains are already configured in `appsettings.json`. No env var overrides needed.

---

### Issue 3: Email BaseUrl

**Problem:** `appsettings.json` has dev URL and email disabled.

**Solution:** Set via Railway environment variables:
```
Email__BaseUrl=https://myuglyrocks.com
Email__Enabled=true
```

---

### Note: Web App Config Route (No Action Required)

[src/web/src/app/config/route.ts](../src/web/src/app/config/route.ts) already includes production domains:
```typescript
const ALLOWED_PUBLIC_HOSTS = [
  'dev.myuglyrocks.com',
  'www.myuglyrocks.com',
  'myuglyrocks.com',
];
```

No changes needed.

---

## Pre-Flight Checklist

### Before Deployment
- [ ] Test build succeeds: `docker build -t test -f src/api/MyUglyRocks.Api/Dockerfile .`
- [ ] Commit and push to `develop`
- [ ] Test in local K8s with production-like config

### Accounts to Create
- [ ] Railway account (with Hobby plan - $5/mo)
- [ ] Cloudflare account (free)
- [ ] Resend account (free)
- [ ] Domain purchased (Namecheap or other)

### Secrets to Generate/Collect
- [ ] JWT Secret (generate new for production)
- [ ] R2 Account ID
- [ ] R2 Access Key ID
- [ ] R2 Secret Access Key
- [ ] R2 Bucket Name (create new for prod)
- [ ] R2 Public URL
- [ ] Resend API Key

---

## Part 1: Create External Accounts & Get Credentials

### 1.1 Railway Account ($5/month)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Go to **Account Settings** → **Billing**
4. Select **Hobby Plan** ($5/month)
5. Add payment method

---

### 1.2 Cloudflare R2 (Free)

#### Create Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up (free)
3. Verify email

#### Create Production Bucket
1. Dashboard → **R2 Object Storage**
2. **Create bucket**
   - Name: `myuglyrocks-prod`
   - Location: Automatic
3. Click bucket → **Settings** → **Public access** → **Allow Access**
4. Copy the public URL: `https://pub-{hash}.r2.dev`

#### Create API Token
1. **R2** → **Manage R2 API Tokens**
2. **Create API Token**
   - Name: `myuglyrocks-prod`
   - Permissions: **Object Read & Write**
   - Bucket: `myuglyrocks-prod`
3. **COPY IMMEDIATELY** (shown once!):
   - Access Key ID
   - Secret Access Key

#### Get Account ID
- Look at URL: `https://dash.cloudflare.com/ACCOUNT_ID/r2`

**Record these:**
```
R2__AccountId=
R2__AccessKeyId=
R2__SecretAccessKey=
R2__BucketName=myuglyrocks-prod
R2__PublicUrl=https://pub-XXXX.r2.dev
```

---

### 1.3 Resend Email (Free)

1. Go to [resend.com](https://resend.com)
2. Sign up
3. **API Keys** → **Create API Key**
   - Name: `myuglyrocks-prod`
   - Permission: Sending access
4. Copy key (starts with `re_`)

**Record:**
```
Email__ApiKey=re_xxxxxxxxxxxxx
```

---

### 1.4 Generate JWT Secret

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Record:**
```
Jwt__Secret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Part 2: Railway Project Setup

### 2.1 Create Project

1. Railway Dashboard → **+ New Project**
2. **Deploy from GitHub repo**
3. Select `MyUglyRocks-App`
4. Delete the auto-created service (we'll add manually)

---

### 2.2 Add PostgreSQL

1. **+ New** → **Database** → **PostgreSQL**
2. Wait for provisioning
3. Click PostgreSQL → **Variables**
4. Note `DATABASE_URL` format

---

### 2.3 Add Redis

1. **+ New** → **Database** → **Redis**
2. Wait for provisioning
3. Note `REDIS_URL` format

---

### 2.4 Add API Service

1. **+ New** → **GitHub Repo** → Select repo
2. **Settings**:
   - Service Name: `api`
   - Dockerfile Path: `src/api/MyUglyRocks.Api/Dockerfile`
   - Branch: `Master`
   - Watch Paths: `src/api/**`

#### API Environment Variables

Click **Variables** → **Raw Editor**:

```env
# Required - ASP.NET
ASPNETCORE_ENVIRONMENT=Production

# Database - Railway auto-links DATABASE_URL, but you need to reference it
# If you added the parser code, Railway's DATABASE_URL will be auto-converted
# Otherwise set manually:
# ConnectionStrings__DefaultConnection=Host=xxx;Database=xxx;Username=xxx;Password=xxx;SSL Mode=Require;Trust Server Certificate=true

# Redis - Same as above
# ConnectionStrings__Redis=xxx:6379,password=xxx

# JWT (GENERATE NEW FOR PRODUCTION!)
Jwt__Secret=YOUR_GENERATED_JWT_SECRET
Jwt__Issuer=MyUglyRocks
Jwt__Audience=MyUglyRocks

# R2 Storage
R2__AccountId=YOUR_R2_ACCOUNT_ID
R2__AccessKeyId=YOUR_R2_ACCESS_KEY
R2__SecretAccessKey=YOUR_R2_SECRET
R2__BucketName=myuglyrocks-prod
R2__PublicUrl=https://pub-xxx.r2.dev

# Email
Email__ApiKey=re_xxxxxxxxxxxx
Email__FromEmail=noreply@myuglyrocks.com
Email__FromName=MyUglyRocks
Email__BaseUrl=https://myuglyrocks.com
Email__Enabled=true
```

> **Note:** CORS and AllowedHosts are already configured in `appsettings.json` - no env vars needed.

#### Link Database References

1. **+ Add Reference** → **Postgres** → `DATABASE_URL`
2. **+ Add Reference** → **Redis** → `REDIS_URL`

---

### 2.5 Add Web Service

1. **+ New** → **GitHub Repo** → Select repo
2. **Settings**:
   - Service Name: `web`
   - Dockerfile Path: `src/web/Dockerfile`
   - Branch: `Master`
   - Watch Paths: `src/web/**`

#### Web Environment Variables

```env
# API URL - Railway sets this but you need custom domain
API_URL=https://api.myuglyrocks.com
NEXT_PUBLIC_API_URL=https://api.myuglyrocks.com
```

---

## Part 3: Domain Setup

### 3.1 Railway Domains

#### API Service:
1. **Settings** → **Networking** → **Generate Domain**
2. Note: `api-production-xxxx.up.railway.app`
3. **+ Custom Domain** → `api.myuglyrocks.com`

#### Web Service:
1. **Settings** → **Networking** → **Generate Domain**
2. Note: `web-production-xxxx.up.railway.app`
3. **+ Custom Domain** → `myuglyrocks.com`
4. **+ Custom Domain** → `www.myuglyrocks.com`

---

### 3.2 Namecheap DNS

1. Namecheap → **Domain List** → **Manage** → **Advanced DNS**
2. Delete existing A/CNAME for @, www, api

#### Add Records:

| Type | Host | Value |
|------|------|-------|
| CNAME | `api` | `api-production-xxxx.up.railway.app` |
| CNAME | `www` | `web-production-xxxx.up.railway.app` |
| URL Redirect | `@` | `https://www.myuglyrocks.com` (301) |

---

### 3.3 Resend Email DNS

1. Resend → **Domains** → **Add Domain** → `myuglyrocks.com`
2. Add DNS records shown by Resend to Namecheap:

| Type | Host | Value |
|------|------|-------|
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` |
| TXT | `resend._domainkey` | (copy from Resend) |
| TXT | (other DKIM records) | (copy from Resend) |

3. Click **Verify** in Resend (wait up to 1 hour)

---

## Part 4: Deploy

### 4.1 Create PR to Master

```bash
git checkout develop
git pull
# Ensure all changes are committed
git checkout Master
git pull
git merge develop
git push
```

Or via GitHub PR: `develop` → `Master`

### 4.2 Monitor Deployment

1. Railway auto-deploys on push to Master
2. Watch build logs for errors
3. Common issues:
   - Missing env vars → deployment fails
   - Database connection fails → check DATABASE_URL parsing
   - R2 fails → check credentials

### 4.3 Verify

```powershell
# Health check
curl https://api.myuglyrocks.com/health

# Website
Start-Process https://myuglyrocks.com
```

---

## Part 5: Post-Deployment

### 5.1 Verify Database Migration

The API auto-runs migrations on startup. Verify:

1. Railway → PostgreSQL → **Query**
2. Run: `SELECT COUNT(*) FROM "Specimens";`
3. Should return 366+ (seed data)

### 5.2 Test Critical Flows

- [ ] Homepage loads
- [ ] Register account
- [ ] Receive verification email
- [ ] Login
- [ ] Create tumbler
- [ ] Create cycle
- [ ] Upload photo (R2 working)
- [ ] Photo displays
- [ ] Post to gallery
- [ ] Logout

### 5.3 Create Admin User (Optional)

Via Railway PostgreSQL Query:
```sql
-- First register normally, then promote to admin:
UPDATE "Users" SET "Role" = 'Admin' WHERE "Email" = 'your@email.com';
```

---

## All Required Environment Variables

### API Service

| Variable | Example | Required |
|----------|---------|----------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | Yes |
| `DATABASE_URL` | (Railway auto) | Yes (linked) |
| `REDIS_URL` | (Railway auto) | Yes (linked) |
| `Jwt__Secret` | `base64string...` | Yes |
| `Jwt__Issuer` | `MyUglyRocks` | Yes |
| `Jwt__Audience` | `MyUglyRocks` | Yes |
| `R2__AccountId` | `abc123...` | Yes |
| `R2__AccessKeyId` | `xxx...` | Yes |
| `R2__SecretAccessKey` | `xxx...` | Yes |
| `R2__BucketName` | `myuglyrocks-prod` | Yes |
| `R2__PublicUrl` | `https://pub-xxx.r2.dev` | Yes |
| `Email__ApiKey` | `re_xxx...` | Yes |
| `Email__FromEmail` | `noreply@myuglyrocks.com` | Yes |
| `Email__FromName` | `MyUglyRocks` | Yes |
| `Email__BaseUrl` | `https://myuglyrocks.com` | Yes |
| `Email__Enabled` | `true` | Yes |

> **Note:** CORS and AllowedHosts are configured in `appsettings.json` - no env vars needed.

### Web Service

| Variable | Example | Required |
|----------|---------|----------|
| `API_URL` | `https://api.myuglyrocks.com` | Yes |
| `NEXT_PUBLIC_API_URL` | `https://api.myuglyrocks.com` | Yes |

---

## DNS Records Summary

| Service | Type | Host | Value |
|---------|------|------|-------|
| Railway API | CNAME | `api` | `api-xxx.up.railway.app` |
| Railway Web | CNAME | `www` | `web-xxx.up.railway.app` |
| Root redirect | URL Redirect | `@` | `https://www.myuglyrocks.com` |
| Email SPF | TXT | `@` | `v=spf1 include:_spf.resend.com ~all` |
| Email DKIM | TXT | `resend._domainkey` | (from Resend) |

---

## Troubleshooting

### API won't start

Check logs:
```bash
railway logs -s api
```

Common causes:
- Missing env var (check all required vars)
- DATABASE_URL format wrong (add parser code)
- R2 credentials wrong

### CORS errors

Verify:
- `Cors__AllowedOrigins__0` matches exact URL (with https://)
- No trailing slash
- Both www and non-www variants added

### Photos not loading

Check:
- R2 bucket has public access enabled
- `R2__PublicUrl` is correct
- R2 credentials are valid

### Email not sending

Check:
- Resend domain is verified (green checkmark)
- `Email__Enabled=true`
- `Email__ApiKey` is correct

### Database connection failed

If you didn't add the DATABASE_URL parser:
1. Get DATABASE_URL value from Railway PostgreSQL
2. Manually convert to .NET format
3. Set `ConnectionStrings__DefaultConnection` env var

---

## Costs

| Service | Monthly |
|---------|---------|
| Railway Hobby | $5 base |
| PostgreSQL usage | ~$1-3 |
| Redis usage | ~$0.50 |
| API + Web compute | ~$2-5 |
| **Railway Total** | **~$8-15** |
| Cloudflare R2 | Free (10GB) |
| Resend | Free (3K/mo) |
| Domain (yearly) | ~$10-15 |
| **Total** | **~$8-15/month** |

---

## Railway CLI Reference

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs
railway logs -s api
railway logs -s web

# Connect to database
railway connect postgres

# Run command in service context
railway run -s api dotnet ef migrations list
```

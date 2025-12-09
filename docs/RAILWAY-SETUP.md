# Railway Deployment Setup

Complete guide to deploying MyUglyRocks to Railway with custom domain on Namecheap.

## Prerequisites

- [Railway Account](https://railway.app) (Hobby plan - $5/mo)
- [Cloudflare Account](https://cloudflare.com) (for R2 storage - free)
- [Resend Account](https://resend.com) (for emails - free tier)
- [Namecheap Account](https://namecheap.com) (domain registrar)
- Domain: `myuglyrocks.com` (purchased on Namecheap)
- GitHub repository

---

## Table of Contents

1. [Create Railway Account](#1-create-railway-account)
2. [Create Railway Project](#2-create-railway-project)
3. [Add Database Services](#3-add-database-services)
4. [Add Application Services](#4-add-application-services)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Get External API Keys](#6-get-external-api-keys)
7. [Custom Domain Setup (Namecheap)](#7-custom-domain-setup-namecheap)
8. [Email Domain Verification](#8-email-domain-verification)
9. [Deploy & Verify](#9-deploy--verify)
10. [Troubleshooting](#troubleshooting)

---

## 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **Login** → Sign in with GitHub
3. Go to **Account Settings** → **Billing**
4. Select **Hobby Plan** ($5/month)
   - Includes $5 usage credits
   - 8GB RAM, 8 vCPU per service
   - 5GB volume storage
5. Add payment method

---

## 2. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **+ New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub
5. Select `MyUglyRocks-App` repository
6. Railway creates a project with the default service

---

## 3. Add Database Services

### Add PostgreSQL

1. In your project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Wait for provisioning (~30 seconds)
4. Click the PostgreSQL service → **Variables** tab
5. Note: `DATABASE_URL` is auto-generated

### Add Redis

1. Click **+ New**
2. Select **Database** → **Redis**
3. Wait for provisioning
4. Note: `REDIS_URL` is auto-generated

---

## 4. Add Application Services

### Add API Service

1. Click **+ New** → **GitHub Repo**
2. Select `MyUglyRocks-App` repository
3. Click on the new service → **Settings**
4. Configure:
   - **Service Name**: `api`
   - **Root Directory**: `/` (leave empty)
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Dockerfile Path**: `src/api/MyUglyRocks.Api/Dockerfile`
5. Under **Source** section:
   - **Branch**: `Master` (only deploy production-ready code)
6. Under **Deploy** section:
   - **Watch Paths**: Add `src/api/**`

### Add Web Service

1. Click **+ New** → **GitHub Repo**
2. Select `MyUglyRocks-App` repository (yes, same repo)
3. Click on the new service → **Settings**
4. Configure:
   - **Service Name**: `web`
   - **Root Directory**: `/` (leave empty)
   - **Dockerfile Path**: `src/web/Dockerfile`
5. Under **Source** section:
   - **Branch**: `Master` (only deploy production-ready code)
6. Under **Deploy** section:
   - **Watch Paths**: Add `src/web/**`

> **Note**: See [GIT-WORKFLOW.md](./GIT-WORKFLOW.md) for the complete branching strategy. Railway only deploys from `Master`, while `develop` is used for local K8s testing.

---

## 5. Configure Environment Variables

### Link Database References

First, link the databases to the API service:

1. Click **API service** → **Variables** tab
2. Click **+ Add Reference**
3. Select **Postgres** → Choose `DATABASE_URL`
4. Click **+ Add Reference** again
5. Select **Redis** → Choose `REDIS_URL`

### API Service Variables

Click **API service** → **Variables** → **Raw Editor**, add:

```env
# ASP.NET Core
ASPNETCORE_ENVIRONMENT=Production

# Database (linked from PostgreSQL service)
ConnectionStrings__DefaultConnection=${{Postgres.DATABASE_URL}}

# Redis (linked from Redis service)
ConnectionStrings__Redis=${{Redis.REDIS_URL}}

# JWT Authentication (generate your own - see Section 6)
Jwt__Secret=YOUR_JWT_SECRET_HERE
Jwt__Issuer=https://api.myuglyrocks.com
Jwt__Audience=https://myuglyrocks.com

# Cloudflare R2 Storage (get from Cloudflare - see Section 6)
R2__AccountId=YOUR_R2_ACCOUNT_ID
R2__AccessKeyId=YOUR_R2_ACCESS_KEY_ID
R2__SecretAccessKey=YOUR_R2_SECRET_ACCESS_KEY
R2__BucketName=myuglyrocks-prod

# Email - Resend (get from Resend - see Section 6)
Email__ApiKey=YOUR_RESEND_API_KEY
Email__FromEmail=noreply@myuglyrocks.com
Email__FromName=MyUglyRocks
Email__BaseUrl=https://myuglyrocks.com
Email__Enabled=true

# CORS - Allow frontend
Cors__AllowedOrigins__0=https://myuglyrocks.com
Cors__AllowedOrigins__1=https://www.myuglyrocks.com
```

### Web Service Variables

Click **Web service** → **Variables** → **Raw Editor**, add:

```env
# API URL - points to your API service
NEXT_PUBLIC_API_URL=https://api.myuglyrocks.com
```

---

## 6. Get External API Keys

### 6.1 Generate JWT Secret

Open PowerShell and run:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Copy the output (e.g., `K7gNp2x...`) and paste into `Jwt__Secret` variable.

### 6.2 Cloudflare R2 Credentials

#### Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for free account
3. Verify email

#### Create R2 Bucket
1. In Cloudflare Dashboard, click **R2 Object Storage** (left sidebar)
2. Click **Create bucket**
3. Bucket name: `myuglyrocks-prod`
4. Location: **Automatic** (or choose nearest region)
5. Click **Create bucket**

#### Create R2 API Token
1. Go to **R2** → **Manage R2 API Tokens** (top right)
2. Click **Create API Token**
3. Configure:
   - **Token name**: `myuglyrocks-prod`
   - **Permissions**: **Object Read & Write**
   - **Specify bucket(s)**: Select `myuglyrocks-prod`
   - **TTL**: Optional (leave blank for no expiry)
4. Click **Create API Token**
5. **IMPORTANT**: Copy these values immediately (shown only once!):
   - **Access Key ID** → paste into `R2__AccessKeyId`
   - **Secret Access Key** → paste into `R2__SecretAccessKey`

#### Get Account ID
1. Go to **R2** overview page
2. Look at the URL: `https://dash.cloudflare.com/ACCOUNT_ID/r2`
3. Or find it in the right sidebar under **Account ID**
4. Copy → paste into `R2__AccountId`

### 6.3 Resend Email API Key

#### Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Click **Get Started**
3. Sign up with email or GitHub
4. Verify your email

#### Create API Key
1. In Resend Dashboard, go to **API Keys** (left sidebar)
2. Click **+ Create API Key**
3. Configure:
   - **Name**: `myuglyrocks-prod`
   - **Permission**: **Sending access**
   - **Domain**: Leave as default for now
4. Click **Add**
5. Copy the API key (starts with `re_`) → paste into `Email__ApiKey`

---

## 7. Custom Domain Setup (Namecheap)

### 7.1 Generate Railway Domains First

Before configuring Namecheap, get the Railway target domains:

#### For API Service:
1. Click **API service** → **Settings** → **Networking**
2. Click **Generate Domain**
3. Railway creates: `api-production-xxxx.up.railway.app`
4. Note this domain - you'll need it for CNAME

#### For Web Service:
1. Click **Web service** → **Settings** → **Networking**
2. Click **Generate Domain**
3. Railway creates: `web-production-xxxx.up.railway.app`
4. Note this domain

### 7.2 Add Custom Domains in Railway

#### API Custom Domain:
1. Click **API service** → **Settings** → **Networking**
2. Click **+ Custom Domain**
3. Enter: `api.myuglyrocks.com`
4. Railway shows: **CNAME target**: `api-production-xxxx.up.railway.app`
5. Status will show "Pending" until DNS is configured

#### Web Custom Domains:
1. Click **Web service** → **Settings** → **Networking**
2. Click **+ Custom Domain**
3. Enter: `myuglyrocks.com`
4. Note the CNAME target
5. Click **+ Custom Domain** again
6. Enter: `www.myuglyrocks.com`
7. Note the CNAME target

### 7.3 Configure Namecheap DNS

1. Log in to [Namecheap](https://namecheap.com)
2. Go to **Domain List**
3. Find `myuglyrocks.com` → Click **Manage**
4. Go to **Advanced DNS** tab

#### Delete Default Records (if any)
- Remove any existing A records or CNAME records for `@`, `www`, `api`

#### Add CNAME Records

Click **Add New Record** for each:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | `api` | `api-production-xxxx.up.railway.app` | Automatic |
| CNAME | `www` | `web-production-xxxx.up.railway.app` | Automatic |
| CNAME | `@` | `web-production-xxxx.up.railway.app` | Automatic |

> **Note**: Replace `xxxx` with your actual Railway subdomain

#### For Root Domain (@)
Namecheap may not allow CNAME on root. If so, use **URL Redirect**:
1. Add record: **URL Redirect Record**
2. Host: `@`
3. Value: `https://www.myuglyrocks.com`
4. Redirect Type: **Permanent (301)**

### 7.4 Verify Domain Connection

1. Wait 5-30 minutes for DNS propagation
2. In Railway, check each custom domain shows **green checkmark**
3. Test in browser:
   - `https://api.myuglyrocks.com` → Should show API
   - `https://myuglyrocks.com` → Should show website
   - `https://www.myuglyrocks.com` → Should show website

#### Check DNS Propagation
```bash
# PowerShell - Check if DNS is resolving
nslookup api.myuglyrocks.com
nslookup www.myuglyrocks.com
```

---

## 8. Email Domain Verification

To send emails from `noreply@myuglyrocks.com`, verify your domain in Resend:

### 8.1 Add Domain in Resend

1. Go to Resend Dashboard → **Domains** (left sidebar)
2. Click **+ Add Domain**
3. Enter: `myuglyrocks.com`
4. Click **Add**
5. Resend shows DNS records you need to add

### 8.2 Add DNS Records in Namecheap

Go back to Namecheap → **Advanced DNS** and add these records (Resend provides exact values):

#### SPF Record (TXT)
| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` | Automatic |

#### DKIM Records (TXT)
Resend will give you 3 DKIM records. Add each one:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT | `resend._domainkey` | `p=MIGfMA0GCS...` (long string from Resend) | Automatic |

> **Note**: Copy the exact values from Resend dashboard - they're unique to your domain

### 8.3 Verify in Resend

1. Go back to Resend → **Domains**
2. Click **Verify** next to your domain
3. Wait for verification (can take up to 1 hour)
4. Status changes from "Pending" to "Verified"

### 8.4 Test Email Sending

After verification, emails from `noreply@myuglyrocks.com` will work.

---

## 9. Deploy & Verify

### 9.1 Trigger Deployment

Railway auto-deploys when you push to GitHub. To manually deploy:

1. Click on a service
2. Click **Deployments** tab
3. Click **Deploy** or **Redeploy**

### 9.2 Check Build Logs

1. Click latest deployment
2. Click **View Logs**
3. Watch for errors during build

### 9.3 Verify Everything Works

```bash
# Check API health
curl https://api.myuglyrocks.com/health

# Open API docs
start https://api.myuglyrocks.com/scalar/v1

# Open website
start https://myuglyrocks.com
```

### 9.4 Check Database Seeding

1. In Railway, click PostgreSQL service
2. Click **Query** tab
3. Run: `SELECT COUNT(*) FROM "Specimens";`
4. Should return 366 (seed data)

---

## Secrets Checklist

| Variable | Where to Get | Status |
|----------|--------------|--------|
| `Jwt__Secret` | Generate (PowerShell) | ☐ |
| `R2__AccountId` | Cloudflare R2 Dashboard | ☐ |
| `R2__AccessKeyId` | R2 API Token creation | ☐ |
| `R2__SecretAccessKey` | R2 API Token creation | ☐ |
| `R2__BucketName` | Your bucket name | ☐ |
| `Email__ApiKey` | Resend API Keys | ☐ |

---

## DNS Records Summary (Namecheap)

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| CNAME | `api` | `api-xxx.up.railway.app` | API subdomain |
| CNAME | `www` | `web-xxx.up.railway.app` | WWW subdomain |
| CNAME or Redirect | `@` | `web-xxx.up.railway.app` | Root domain |
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` | Email SPF |
| TXT | `resend._domainkey` | (from Resend) | Email DKIM |

---

## Troubleshooting

### Domain Not Working

| Issue | Solution |
|-------|----------|
| "DNS not configured" in Railway | Wait 30 min for DNS propagation, check Namecheap records |
| ERR_NAME_NOT_RESOLVED | CNAME record missing or incorrect |
| SSL certificate error | Wait for Railway to provision cert (can take 10 min) |
| Redirect loop | Check you don't have conflicting A and CNAME records |

### Application Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check logs, likely OOM - service crashed |
| CORS errors | Verify `Cors__AllowedOrigins` matches your domain exactly |
| Database connection failed | Check `DATABASE_URL` is linked in Variables |
| Email not sending | Verify Resend domain is verified, check API key |

### View Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs
```

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Railway Hobby Plan | $5 (includes $5 credit) |
| PostgreSQL usage | ~$1-2 |
| Redis usage | ~$0.50 |
| API + Web usage | ~$1-2 |
| **Railway Total** | **~$5-10** |
| Cloudflare R2 | Free (10GB storage) |
| Resend | Free (3,000 emails/mo) |
| Namecheap Domain | ~$10-15/year |

---

## Quick Reference Commands

```bash
# Railway CLI
railway login          # Authenticate
railway link           # Link to project
railway logs           # View logs
railway logs -s api    # View specific service logs
railway run <cmd>      # Run command in Railway environment
railway connect postgres  # Connect to PostgreSQL shell

# DNS Check
nslookup api.myuglyrocks.com
nslookup www.myuglyrocks.com

# Test endpoints
curl https://api.myuglyrocks.com/health
curl https://api.myuglyrocks.com/api/specimens
```

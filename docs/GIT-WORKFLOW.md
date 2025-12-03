# Git Workflow & Branch Strategy

## Overview

This document outlines the Git branching strategy for MyUglyRocks development.

```
Master ──────────────────────────────────► Railway Production (auto-deploy)
          ↑
          │ PR + merge (requires review)
          │
develop ─────────────────────────────────► Local K8s / Integration Testing
          ↑
          │ PR + merge
          │
feature/* ───────────────────────────────► Local development
bugfix/*
```

---

## Branch Descriptions

| Branch | Purpose | Deploys To | Protected |
|--------|---------|------------|-----------|
| `Master` | Production-ready code | Railway (auto) | Yes |
| `develop` | Integration/staging | Local K8s | Yes |
| `feature/*` | New features | Local only | No |
| `bugfix/*` | Bug fixes | Local only | No |
| `hotfix/*` | Urgent production fixes | Local → Master | No |

---

## Initial Setup

### Step 1: Create `develop` Branch

From your current `Master` branch:

```bash
# Make sure you're on Master and it's up to date
git checkout Master
git pull origin Master

# Create develop branch from Master
git checkout -b develop

# Push develop to remote
git push -u origin develop
```

### Step 2: Configure GitHub Branch Protection

Go to GitHub → Repository → **Settings** → **Branches**

#### Protect `Master` Branch

1. Click **Add branch protection rule**
2. Branch name pattern: `Master`
3. Enable:
   - ☑️ **Require a pull request before merging**
     - ☑️ Require approvals: `1` (or `0` if solo developer)
     - ☑️ Dismiss stale PR approvals when new commits are pushed
   - ☑️ **Require status checks to pass before merging** (optional - add later with CI)
   - ☑️ **Require conversation resolution before merging**
   - ☑️ **Do not allow bypassing the above settings**
4. Click **Create**

#### Protect `develop` Branch

1. Click **Add branch protection rule**
2. Branch name pattern: `develop`
3. Enable:
   - ☑️ **Require a pull request before merging**
     - Require approvals: `0` (can merge your own PRs)
   - ☑️ **Require conversation resolution before merging**
4. Click **Create**

### Step 3: Set Default Branch

1. Go to **Settings** → **General** → **Default branch**
2. Change default branch to `develop`
3. This means new clones start on `develop`, and PRs default to `develop`

### Step 4: Configure Railway

Railway should only deploy from `Master`:

1. Go to Railway Dashboard → Your Project
2. Click on **API service** → **Settings**
3. Under **Source**:
   - **Branch**: `Master`
4. Repeat for **Web service**

Now Railway only auto-deploys when code is merged to `Master`.

---

## Daily Workflow

### Starting New Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/photo-upload

# Work on your feature...
git add .
git commit -m "Add photo upload component"
```

### Pushing Feature Branch

```bash
# Push to remote
git push -u origin feature/photo-upload
```

### Creating PR to develop

1. Go to GitHub → **Pull requests** → **New pull request**
2. Base: `develop` ← Compare: `feature/photo-upload`
3. Add description of changes
4. Create PR
5. Review (or self-approve if solo)
6. **Squash and merge** (keeps history clean)
7. Delete feature branch

### Testing in Local K8s

After merging to `develop`:

```bash
git checkout develop
git pull origin develop

# Rebuild and deploy to local K8s
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .

kubectl rollout restart deployment/myuglyrocks-api -n myuglyrocks
kubectl rollout restart deployment/myuglyrocks-web -n myuglyrocks
```

### Promoting to Production

When `develop` is stable and tested:

1. Go to GitHub → **Pull requests** → **New pull request**
2. Base: `Master` ← Compare: `develop`
3. Title: `Release: [description]` (e.g., "Release: Photo upload feature")
4. Review all changes since last release
5. **Create a merge commit** (preserves release history)
6. Railway auto-deploys to production

---

## Hotfix Workflow

For urgent production bugs:

```bash
# Create hotfix from Master
git checkout Master
git pull origin Master
git checkout -b hotfix/fix-login-crash

# Fix the bug
git add .
git commit -m "Fix login crash when session expired"

# Push and create PR directly to Master
git push -u origin hotfix/fix-login-crash
```

1. Create PR: Base: `Master` ← Compare: `hotfix/fix-login-crash`
2. Get quick review, merge to Master
3. Railway auto-deploys fix
4. **Important**: Also merge hotfix to develop:

```bash
git checkout develop
git pull origin develop
git merge origin/Master
git push origin develop
```

---

## Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/short-description` | `feature/photo-upload` |
| Bug fix | `bugfix/issue-description` | `bugfix/login-redirect` |
| Hotfix | `hotfix/urgent-fix` | `hotfix/fix-crash` |
| Release | `release/version` | `release/1.0.0` (optional) |

---

## Commit Message Format

```
<type>: <short description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: Add photo upload to stages

fix: Resolve login crash when session expired

docs: Update Railway setup guide

chore: Remove Akeyless dependencies
```

---

## Migration: Current State → New Workflow

You're currently on `feature-akeyless-k8s-implementation`. Here's how to migrate:

### Option A: Merge current work first (Recommended)

```bash
# 1. Finish current feature branch
git add .
git commit -m "Complete K8s implementation and Akeyless cleanup"
git push origin feature-akeyless-k8s-implementation

# 2. Create PR to Master (one-time, since develop doesn't exist yet)
# Go to GitHub, create PR: Master ← feature-akeyless-k8s-implementation
# Merge it

# 3. Create develop from updated Master
git checkout Master
git pull origin Master
git checkout -b develop
git push -u origin develop

# 4. Set up branch protection (see Step 2 above)

# 5. Delete old feature branch
git branch -d feature-akeyless-k8s-implementation
git push origin --delete feature-akeyless-k8s-implementation
```

### Option B: Keep current work, set up structure

```bash
# 1. Create develop from Master (without your changes)
git checkout Master
git pull origin Master
git checkout -b develop
git push -u origin develop

# 2. Merge your feature into develop
git merge feature-akeyless-k8s-implementation

# 3. Push develop
git push origin develop

# 4. When ready for prod, PR develop → Master
```

---

## Quick Reference

```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/name

# Push feature
git push -u origin feature/name

# After PR merged, update local develop
git checkout develop && git pull

# Rebuild local K8s
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
kubectl rollout restart deployment/myuglyrocks-api -n myuglyrocks

# Sync develop with Master (after hotfix)
git checkout develop && git merge origin/Master && git push
```

---

## Visual: PR Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub                                │
│                                                              │
│  feature/xyz ──PR──► develop ──PR──► Master                 │
│       │                  │               │                   │
│       │                  │               │                   │
│       ▼                  ▼               ▼                   │
│  Local Dev         Local K8s        Railway                 │
│  (your machine)    (testing)        (production)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

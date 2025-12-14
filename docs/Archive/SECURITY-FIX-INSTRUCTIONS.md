# Security Vulnerability Fix Instructions

This document describes the security vulnerabilities detected by GitHub Actions and how to resolve them.

---

## Summary of Issues Found

| Package | Old Version | Fixed Version | Severity | Status |
|---------|-------------|---------------|----------|--------|
| `next` (NPM) | 16.0.8 | 16.0.10 | **High** | Fixed in code |
| `SixLabors.ImageSharp` (.NET) | 3.1.8 | 3.1.12 | Moderate | Fixed in code |
| `Newtonsoft.Json` (.NET transitive) | 11.0.1 | 13.0.3 | **High** | Fixed in code |

---

## What Was Fixed (Already Done)

### 1. Next.js High Severity Vulnerabilities

**Files changed:** `src/web/package.json`

- Updated `next` from `16.0.8` to `16.0.10`
- Updated `@next/bundle-analyzer` from `^16.0.8` to `^16.0.10`
- Updated `eslint-config-next` from `16.0.8` to `16.0.10`

**Vulnerabilities addressed:**
- [GHSA-w37m-7fhw-fmv9](https://github.com/advisories/GHSA-w37m-7fhw-fmv9) - Server Actions Source Code Exposure
- [GHSA-mwv6-3258-q52c](https://github.com/advisories/GHSA-mwv6-3258-q52c) - DoS with Server Components

### 2. SixLabors.ImageSharp Moderate Severity Vulnerability

**Files changed:** `src/api/MyUglyRocks.Infrastructure/MyUglyRocks.Infrastructure.csproj`

- Updated `SixLabors.ImageSharp` from `3.1.8` to `3.1.12`

**Vulnerability addressed:**
- [GHSA-rxmq-m78w-7wmc](https://github.com/advisories/GHSA-rxmq-m78w-7wmc)

### 3. Newtonsoft.Json High Severity Vulnerability (Transitive)

**Files changed:** `src/api/MyUglyRocks.Infrastructure/MyUglyRocks.Infrastructure.csproj`

- Added direct reference to `Newtonsoft.Json` version `13.0.3`
- This overrides the transitive dependency from Hangfire (which pulls in 11.0.1)

**Vulnerability addressed:**
- [GHSA-5crp-9r3c-p9vr](https://github.com/advisories/GHSA-5crp-9r3c-p9vr) - Insecure deserialization

---

## What You Need To Do

### Step 1: Update NPM Lock File

After pulling the changes, update the lock file to install the new Next.js version:

```bash
cd src/web
npm install
```

This will update `package-lock.json` with the new versions.

### Step 2: Verify .NET Packages Restore

Run a restore to verify the .NET packages are correct:

```bash
cd src/api
dotnet restore
```

### Step 3: Fix CI Workflow (if needed)

The build error in CI was:
```
error NETSDK1004: Assets file not found. Run a NuGet package restore to generate this file.
```

This happens because `dotnet build --no-restore` was called without a successful `dotnet restore` first.

**Check your GitHub Actions workflow file** (likely `.github/workflows/security-scan.yml` or similar):

```yaml
# Make sure restore runs BEFORE build
- name: Restore .NET packages
  run: dotnet restore src/api/MyUglyRocks.Api/MyUglyRocks.Api.csproj

- name: Build .NET project
  run: dotnet build src/api/MyUglyRocks.Api/MyUglyRocks.Api.csproj --no-restore
```

If restore and build are in the same step, remove `--no-restore`:

```yaml
- name: Build .NET project
  run: dotnet build src/api/MyUglyRocks.Api/MyUglyRocks.Api.csproj
```

### Step 4: Commit Lock File Changes

```bash
git add src/web/package-lock.json
git commit -m "chore: Update package-lock.json for Next.js 16.0.10"
git push
```

---

## Verification

After pushing, the security scan should pass. You can verify locally:

**NPM audit:**
```bash
cd src/web
npm audit --audit-level=moderate
```

**.NET vulnerability check:**
```bash
cd src/api
dotnet list package --vulnerable
```

---

## References

- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [SixLabors.ImageSharp NuGet](https://www.nuget.org/packages/SixLabors.ImageSharp)
- [Hangfire Newtonsoft.Json Issue](https://github.com/HangfireIO/Hangfire/issues/2468)

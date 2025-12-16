<#
.SYNOPSIS
    MyUglyRocks Database Restore Script (Windows)

.DESCRIPTION
    Restores the PostgreSQL database from an R2 backup.
    Use this when the API/Hangfire is down and you cannot restore via Admin panel.

.PARAMETER BackupKey
    The R2 object key of the backup to restore (e.g., "daily/myuglyrocks_2025-01-01_04-00-00.dump")

.PARAMETER NoSafety
    Skip creating a safety backup before restore

.PARAMETER DatabaseUrl
    PostgreSQL connection URL (default: $env:DATABASE_URL)

.EXAMPLE
    .\restore.ps1
    # Lists available backups

.EXAMPLE
    .\restore.ps1 -BackupKey "daily/myuglyrocks_2025-01-01_04-00-00.dump"
    # Restores specific backup (creates safety backup first)

.EXAMPLE
    .\restore.ps1 -BackupKey "daily/myuglyrocks_2025-01-01_04-00-00.dump" -NoSafety
    # Restores without creating safety backup

.NOTES
    Prerequisites:
    - Wrangler CLI: npm install -g wrangler
    - PostgreSQL client: Download from https://www.postgresql.org/download/windows/
    - Wrangler authenticated: wrangler login
#>

param(
    [string]$BackupKey,
    [switch]$NoSafety,
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$BackupPassword = $env:BACKUP_PASSWORD
)

# Load System.Web assembly for URL decoding (required for passwords with special chars)
Add-Type -AssemblyName System.Web

$ErrorActionPreference = "Stop"
$Bucket = "myuglyrocks-media-backup"
$TempDir = "$env:TEMP\myuglyrocks-restore"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  MyUglyRocks Database Restore" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "Error: wrangler CLI not found. Install with: npm install -g wrangler" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
    Write-Host "Error: pg_restore not found. Install PostgreSQL client tools" -ForegroundColor Red
    exit 1
}

# Check DATABASE_URL
if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    Write-Host "Error: DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:DATABASE_URL = 'postgresql://user:pass@host:port/dbname'"
    exit 1
}

# Parse DATABASE_URL
function Parse-DatabaseUrl {
    param([string]$Url)

    $uri = [System.Uri]::new($Url)

    # Extract and decode password (handles special characters)
    $userInfo = $uri.UserInfo -split ':', 2
    $username = $userInfo[0]
    $password = if ($userInfo.Length -gt 1) {
        [System.Web.HttpUtility]::UrlDecode($userInfo[1])
    } else { "" }

    return @{
        Host = $uri.Host
        Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
        Database = $uri.AbsolutePath.TrimStart('/')
        Username = $username
        Password = $password
        SslMode = if ($uri.Query -match 'sslmode') { "require" } else { "" }
    }
}

$DbConfig = Parse-DatabaseUrl -Url $DatabaseUrl

# Set environment variables for pg_dump/pg_restore
$env:PGHOST = $DbConfig.Host
$env:PGPORT = $DbConfig.Port
$env:PGDATABASE = $DbConfig.Database
$env:PGUSER = $DbConfig.Username
$env:PGPASSWORD = $DbConfig.Password
if ($DbConfig.SslMode) {
    $env:PGSSLMODE = $DbConfig.SslMode
}

Write-Host "Database: " -NoNewline
Write-Host "$($DbConfig.Database)" -ForegroundColor Green -NoNewline
Write-Host " @ " -NoNewline
Write-Host "$($DbConfig.Host):$($DbConfig.Port)" -ForegroundColor Green
Write-Host ""

# Function to list backups
function List-Backups {
    Write-Host "Available backups in $Bucket:" -ForegroundColor Yellow
    Write-Host ""

    $prefixes = @("daily/", "weekly/", "monthly/", "manual/", "pre-restore/")

    foreach ($prefix in $prefixes) {
        Write-Host "=== $($prefix.TrimEnd('/')) ===" -ForegroundColor Green

        try {
            $output = & wrangler r2 object list $Bucket --prefix=$prefix 2>&1
            $keys = $output | Select-String -Pattern '"key":\s*"([^"]+)"' -AllMatches |
                ForEach-Object { $_.Matches } |
                ForEach-Object { $_.Groups[1].Value } |
                Select-Object -First 10

            if ($keys) {
                $keys | ForEach-Object { Write-Host "  $_" }
            } else {
                Write-Host "  (none)"
            }
        } catch {
            Write-Host "  (error listing)" -ForegroundColor Red
        }
        Write-Host ""
    }
}

# Function to create safety backup
function Create-SafetyBackup {
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd_HH-mm-ss")
    $filename = "pre-restore/cli-safety_$timestamp.dump"
    $tempfile = Join-Path $TempDir "safety_backup.dump"

    Write-Host "Creating safety backup before restore..." -ForegroundColor Yellow

    if (-not (Test-Path $TempDir)) {
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    }

    # Create backup
    & pg_dump -Fc -Z5 --no-owner --no-acl -f $tempfile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create safety backup" -ForegroundColor Red
        return $false
    }

    # Upload to R2
    Write-Host "Uploading safety backup to R2..."
    & wrangler r2 object put "$Bucket/$filename" --file=$tempfile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to upload safety backup" -ForegroundColor Red
        Remove-Item -Path $tempfile -ErrorAction SilentlyContinue
        return $false
    }

    Remove-Item -Path $tempfile -ErrorAction SilentlyContinue
    Write-Host "Safety backup created: $filename" -ForegroundColor Green
    Write-Host ""

    return $true
}

# Function to check if file is encrypted (has OpenSSL "Salted__" header)
function Test-IsEncrypted {
    param([string]$FilePath)

    $bytes = [System.IO.File]::ReadAllBytes($FilePath)
    if ($bytes.Length -lt 8) { return $false }

    $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..7])
    return $header -eq "Salted__"
}

# Function to decrypt backup file
function Decrypt-Backup {
    param(
        [string]$EncryptedFile,
        [string]$DecryptedFile
    )

    if ([string]::IsNullOrEmpty($BackupPassword)) {
        Write-Host "Error: Backup is encrypted but BACKUP_PASSWORD is not set" -ForegroundColor Red
        Write-Host "Set it with: `$env:BACKUP_PASSWORD = 'your-backup-password'"
        return $false
    }

    Write-Host "Decrypting backup (AES-256-CBC with 600K PBKDF2 iterations)..." -ForegroundColor Yellow

    # Set password as environment variable for openssl
    $env:BACKUP_PASSWORD_TEMP = $BackupPassword

    try {
        & openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in $EncryptedFile -out $DecryptedFile -pass env:BACKUP_PASSWORD_TEMP 2>&1
        $result = $LASTEXITCODE

        if ($result -ne 0) {
            Write-Host "Failed to decrypt backup. Wrong password?" -ForegroundColor Red
            return $false
        }

        Write-Host "Backup decrypted successfully" -ForegroundColor Green
        return $true
    }
    finally {
        # Always clear the temp password, even if an exception occurs
        Remove-Item Env:\BACKUP_PASSWORD_TEMP -ErrorAction SilentlyContinue
    }
}

# Function to restore backup
function Restore-Backup {
    param([string]$Key)

    $tempfile = Join-Path $TempDir "restore.dump"
    $restorefile = $tempfile

    Write-Host "Downloading backup: $Key" -ForegroundColor Yellow

    if (-not (Test-Path $TempDir)) {
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    }

    # Download from R2
    & wrangler r2 object get "$Bucket/$Key" --file=$tempfile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to download backup" -ForegroundColor Red
        exit 1
    }

    # Check if backup is encrypted and decrypt if needed
    if (Test-IsEncrypted -FilePath $tempfile) {
        Write-Host "Backup is encrypted" -ForegroundColor Yellow
        $decrypted = Join-Path $TempDir "restore_decrypted.dump"

        $decryptResult = Decrypt-Backup -EncryptedFile $tempfile -DecryptedFile $decrypted
        if (-not $decryptResult) {
            Remove-Item -Path $tempfile -ErrorAction SilentlyContinue
            exit 1
        }

        Remove-Item -Path $tempfile -ErrorAction SilentlyContinue
        $restorefile = $decrypted
    } else {
        Write-Host "Backup is not encrypted" -ForegroundColor Green
    }

    Write-Host "Restoring database..." -ForegroundColor Yellow
    Write-Host "WARNING: This will REPLACE ALL DATA in $($DbConfig.Database)" -ForegroundColor Red
    Write-Host ""

    # Restore
    & pg_restore --clean --if-exists --single-transaction --no-owner --no-acl `
        -d $DbConfig.Database $restorefile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "pg_restore failed. Check the error messages above." -ForegroundColor Red
        Remove-Item -Path $restorefile -ErrorAction SilentlyContinue
        exit 1
    }

    Remove-Item -Path $restorefile -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Restore completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}

# Main logic
if ([string]::IsNullOrEmpty($BackupKey)) {
    List-Backups
    Write-Host ""
    Write-Host "To restore a backup, run:"
    Write-Host "  .\restore.ps1 -BackupKey <backup-key>"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\restore.ps1 -BackupKey 'daily/myuglyrocks_2025-01-01_04-00-00.dump'"
    exit 0
}

# Confirm restore
Write-Host "========================================" -ForegroundColor Red
Write-Host "  WARNING: DATABASE RESTORE" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "You are about to restore:"
Write-Host "  Backup: $BackupKey"
Write-Host "  Database: $($DbConfig.Database) @ $($DbConfig.Host)"
Write-Host ""
Write-Host "This will REPLACE ALL DATA in the database!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Type 'RESTORE' to confirm"
if ($confirm -ne "RESTORE") {
    Write-Host "Restore cancelled."
    exit 0
}

Write-Host ""

# Create safety backup unless -NoSafety
if (-not $NoSafety) {
    $safetyResult = Create-SafetyBackup
    if (-not $safetyResult) {
        exit 1
    }
}

# Perform restore
Restore-Backup -Key $BackupKey

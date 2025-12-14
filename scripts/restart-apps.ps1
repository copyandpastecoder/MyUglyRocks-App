<#
.SYNOPSIS
    Rebuilds and restarts the MyUglyRocks API and Web deployments in Kubernetes.

.DESCRIPTION
    This script rebuilds Docker images from source code and restarts the deployments.
    By default, it rebuilds images to ensure the latest code is deployed.
    Also starts a port-forward for PostgreSQL so you can connect from DataGrip.

.PARAMETER SkipApi
    Skip rebuilding and restarting the API deployment.

.PARAMETER SkipWeb
    Skip rebuilding and restarting the Web deployment.

.PARAMETER SkipBuild
    Skip rebuilding Docker images (just restart pods with existing images).

.PARAMETER NoCache
    Build Docker images without using cache (forces complete rebuild).

.PARAMETER NoPortForward
    Skip starting the PostgreSQL port-forward.

.EXAMPLE
    .\restart-apps.ps1
    # Rebuilds both images and restarts both apps (DEFAULT)

.EXAMPLE
    .\restart-apps.ps1 -SkipBuild
    # Just restarts pods without rebuilding (uses existing images)

.EXAMPLE
    .\restart-apps.ps1 -NoCache
    # Rebuilds images from scratch (no Docker cache)

.EXAMPLE
    .\restart-apps.ps1 -SkipWeb
    # Rebuilds and restarts only the API

.EXAMPLE
    .\restart-apps.ps1 -NoPortForward
    # Rebuilds and restarts but doesn't start DB port-forward
#>

param(
    [switch]$SkipApi,
    [switch]$SkipWeb,
    [switch]$SkipBuild,
    [switch]$NoCache,
    [switch]$NoPortForward
)

$ErrorActionPreference = "Stop"
$Namespace = "myuglyrocks"
# Script is in scripts/ folder, so repo root is one level up
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MyUglyRocks App Restart Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: kubectl is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if namespace exists
$nsExists = kubectl get namespace $Namespace 2>$null
if (-not $nsExists) {
    Write-Host "ERROR: Namespace '$Namespace' does not exist" -ForegroundColor Red
    exit 1
}

# Determine which deployments to work with
$deployments = @()
if (-not $SkipApi) { $deployments += "myuglyrocks-api" }
if (-not $SkipWeb) { $deployments += "myuglyrocks-web" }

if ($deployments.Count -eq 0) {
    Write-Host "Nothing to restart (both -SkipApi and -SkipWeb specified)" -ForegroundColor Yellow
    exit 0
}

# Build Docker images (default behavior)
if (-not $SkipBuild) {
    Write-Host "Rebuilding Docker images..." -ForegroundColor Yellow

    $buildArgs = @()
    if ($NoCache) {
        $buildArgs += "--no-cache"
        Write-Host "  (Using --no-cache for fresh build)" -ForegroundColor Gray
    }

    Push-Location $RepoRoot
    try {
        if (-not $SkipApi) {
            Write-Host "`n  Building API image..." -ForegroundColor Gray
            & docker build @buildArgs -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
            if ($LASTEXITCODE -ne 0) { throw "API image build failed" }
            Write-Host "  API image built successfully" -ForegroundColor Green
        }

        if (-not $SkipWeb) {
            Write-Host "`n  Building Web image..." -ForegroundColor Gray
            & docker build @buildArgs -t myuglyrocks-web:latest -f src/web/Dockerfile .
            if ($LASTEXITCODE -ne 0) { throw "Web image build failed" }
            Write-Host "  Web image built successfully" -ForegroundColor Green
        }
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "Skipping image rebuild (-SkipBuild specified)" -ForegroundColor Yellow
}

Write-Host "`nRestarting deployments: $($deployments -join ', ')" -ForegroundColor Yellow

# Perform rolling restart for graceful pod replacement
Write-Host "`nPerforming rolling restart..." -ForegroundColor Gray
foreach ($deployment in $deployments) {
    Write-Host "  Restarting $deployment..." -ForegroundColor Gray
    kubectl rollout restart deployment $deployment -n $Namespace
}

# Wait for rollout
Write-Host "`nWaiting for deployments to be ready..." -ForegroundColor Gray
foreach ($deployment in $deployments) {
    Write-Host "  Waiting for $deployment..." -ForegroundColor Gray
    kubectl rollout status deployment $deployment -n $Namespace --timeout=180s
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  WARNING: $deployment rollout may have issues" -ForegroundColor Yellow
    } else {
        Write-Host "  $deployment is ready" -ForegroundColor Green
    }
}

# Show pod status
Write-Host "`nCurrent pod status:" -ForegroundColor Yellow
kubectl get pods -n $Namespace -l "app in (myuglyrocks-api,myuglyrocks-web)" -o wide

# Start PostgreSQL port-forward
if (-not $NoPortForward) {
    Write-Host "`nStarting PostgreSQL port-forward..." -ForegroundColor Yellow

    # Kill any existing port-forward on 5432
    $existingPF = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    if ($existingPF) {
        Write-Host "  Stopping existing port-forward on port 5432..." -ForegroundColor Gray
        $existingPF | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    }

    # Start port-forward in background
    $null = Start-Job -ScriptBlock {
        kubectl port-forward svc/postgres 5432:5432 -n myuglyrocks 2>&1
    }

    Start-Sleep -Seconds 2

    # Check if port-forward started successfully
    $portOpen = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if ($portOpen.TcpTestSucceeded) {
        Write-Host "  PostgreSQL port-forward started on localhost:5432" -ForegroundColor Green
        Write-Host "`n  DataGrip connection details:" -ForegroundColor Cyan
        Write-Host "    Host: localhost" -ForegroundColor White
        Write-Host "    Port: 5432" -ForegroundColor White
        Write-Host "    Database: myuglyrocks" -ForegroundColor White
        Write-Host "    User: postgres" -ForegroundColor White
        Write-Host "    Password: (from myuglyrocks-secrets)" -ForegroundColor White
    } else {
        Write-Host "  WARNING: Port-forward may not have started correctly" -ForegroundColor Yellow
        Write-Host "  Run manually: kubectl port-forward svc/postgres 5432:5432 -n myuglyrocks" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Restart complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAccess the app at: https://dev.myuglyrocks.com" -ForegroundColor Cyan
if (-not $NoPortForward) {
    Write-Host "PostgreSQL available at: localhost:5432" -ForegroundColor Cyan
}
Write-Host ""

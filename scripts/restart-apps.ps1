<#
.SYNOPSIS
    Restarts the MyUglyRocks API and Web deployments in Kubernetes.

.DESCRIPTION
    This script scales down the API and Web deployments to 0 replicas,
    then scales them back up to 1 replica each. Useful for picking up
    new Docker images or resetting the applications.

    Also starts a port-forward for PostgreSQL so you can connect from DataGrip.

.PARAMETER SkipApi
    Skip restarting the API deployment.

.PARAMETER SkipWeb
    Skip restarting the Web deployment.

.PARAMETER RebuildImages
    Rebuild Docker images before restarting (requires running from repo root).

.PARAMETER NoPortForward
    Skip starting the PostgreSQL port-forward.

.EXAMPLE
    .\restart-apps.ps1
    Or D:\MyRepo\MyUglyRocks-App\scripts\restart-apps.ps1
    # Restarts both API and Web, starts DB port-forward

.EXAMPLE
    .\restart-apps.ps1 -SkipWeb
    # Restarts only the API

.EXAMPLE
    .\restart-apps.ps1 -RebuildImages
    # Rebuilds images and restarts both apps

.EXAMPLE
    .\restart-apps.ps1 -NoPortForward
    # Restarts apps but doesn't start DB port-forward
#>

param(
    [switch]$SkipApi,
    [switch]$SkipWeb,
    [switch]$RebuildImages,
    [switch]$NoPortForward
)

$ErrorActionPreference = "Stop"
$Namespace = "myuglyrocks"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

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

# Rebuild images if requested
if ($RebuildImages) {
    Write-Host "Rebuilding Docker images..." -ForegroundColor Yellow

    Push-Location $RepoRoot
    try {
        if (-not $SkipApi) {
            Write-Host "`n  Building API image..." -ForegroundColor Gray
            docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
            if ($LASTEXITCODE -ne 0) { throw "API image build failed" }
            Write-Host "  API image built successfully" -ForegroundColor Green
        }

        if (-not $SkipWeb) {
            Write-Host "`n  Building Web image..." -ForegroundColor Gray
            docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .
            if ($LASTEXITCODE -ne 0) { throw "Web image build failed" }
            Write-Host "  Web image built successfully" -ForegroundColor Green
        }
    }
    finally {
        Pop-Location
    }
}

# Determine which deployments to restart
$deployments = @()
if (-not $SkipApi) { $deployments += "myuglyrocks-api" }
if (-not $SkipWeb) { $deployments += "myuglyrocks-web" }

if ($deployments.Count -eq 0) {
    Write-Host "Nothing to restart (both -SkipApi and -SkipWeb specified)" -ForegroundColor Yellow
    exit 0
}

Write-Host "Restarting deployments: $($deployments -join ', ')" -ForegroundColor Yellow

# Scale down
Write-Host "`nScaling down..." -ForegroundColor Gray
foreach ($deployment in $deployments) {
    Write-Host "  Scaling $deployment to 0 replicas" -ForegroundColor Gray
    kubectl scale deployment $deployment -n $Namespace --replicas=0 2>&1 | Out-Null
}

# Wait a moment for pods to terminate
Start-Sleep -Seconds 2

# Scale up
Write-Host "`nScaling up..." -ForegroundColor Gray
foreach ($deployment in $deployments) {
    Write-Host "  Scaling $deployment to 1 replica" -ForegroundColor Gray
    kubectl scale deployment $deployment -n $Namespace --replicas=1 2>&1 | Out-Null
}

# Wait for rollout
Write-Host "`nWaiting for deployments to be ready..." -ForegroundColor Gray
foreach ($deployment in $deployments) {
    Write-Host "  Waiting for $deployment..." -ForegroundColor Gray
    kubectl rollout status deployment $deployment -n $Namespace --timeout=120s
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
    $job = Start-Job -ScriptBlock {
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

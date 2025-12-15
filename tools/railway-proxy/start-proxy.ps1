# Railway PostgreSQL Proxy for DataGrip
# This script runs a socat container that tunnels to Railway's PostgreSQL
#
# Prerequisites:
#   - railway login
#   - railway link (to your production project)
#
# Usage: .\start-proxy.ps1
# Then connect DataGrip to localhost:5433

$LOCAL_PORT = 5433

Write-Host "Starting Railway PostgreSQL proxy on localhost:$LOCAL_PORT..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the proxy" -ForegroundColor Yellow
Write-Host ""

# Use railway run to inject PGHOST and PGPORT, then run docker with those vars
railway run -- powershell -Command {
    Write-Host "Connecting to: $env:PGHOST`:$env:PGPORT" -ForegroundColor Green
    docker run --rm -it -p 5433:5432 -e PGHOST=$env:PGHOST -e PGPORT=$env:PGPORT railway-proxy
}

# seed-photos.ps1
# Runs the API locally to seed demo photos to R2
#
# Usage:
#   1. Start PostgreSQL port-forward in another terminal:
#      kubectl port-forward deployment/postgres 5432:5432 -n myuglyrocks
#
#   2. Set R2 credentials (get from Cloudflare dashboard):
#      $env:R2__AccountId = 'your-account-id'
#      $env:R2__AccessKeyId = 'your-access-key-id'
#      $env:R2__SecretAccessKey = 'your-secret-access-key'
#
#   3. Run this script:
#      .\scripts\seed-photos.ps1
#
#   4. Wait for seeding to complete, then press Ctrl+C to stop the API

param(
    [switch]$CleanupOnly,
    [switch]$SkipCleanup
)

Write-Host "=== Demo Photo Seeding Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if port-forward is running
$pgPort = netstat -an | Select-String "127.0.0.1:5432.*LISTENING"
if (-not $pgPort) {
    Write-Host "ERROR: PostgreSQL port-forward not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "In another terminal, run:" -ForegroundColor Yellow
    Write-Host "  kubectl port-forward deployment/postgres 5432:5432 -n myuglyrocks" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "[OK] PostgreSQL port-forward is running" -ForegroundColor Green

# Check if photo folders exist
if (-not (Test-Path "D:\DemoRockPhotos\Before")) {
    Write-Host "ERROR: Photo folder D:\DemoRockPhotos\Before not found!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "D:\DemoRockPhotos\After")) {
    Write-Host "ERROR: Photo folder D:\DemoRockPhotos\After not found!" -ForegroundColor Red
    exit 1
}

$beforeCount = (Get-ChildItem "D:\DemoRockPhotos\Before" -Filter "*.jpg").Count
$afterCount = (Get-ChildItem "D:\DemoRockPhotos\After" -Filter "*.jpg").Count
Write-Host "[OK] Found $beforeCount photos in Before folder, $afterCount in After folder" -ForegroundColor Green

# Set environment variables for local run
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Database=myuglyrocks;Username=postgres;Password=yHQith75s7yDsztr7k0AOggEINWnNw3R"
$env:DEMO_USER_EMAIL = "demo@myuglyrocks.com"
$env:DEMO_USER_PASSWORD = "Demo123!"

# R2 credentials - must be set before running
$env:R2__BucketName = "dev-myuglyrocks-media"
$env:R2__PublicUrl = "https://pub-b409015555184d2ea808e87b602b1da5.r2.dev"

if (-not $env:R2__AccountId -or -not $env:R2__AccessKeyId -or -not $env:R2__SecretAccessKey) {
    Write-Host ""
    Write-Host "ERROR: R2 credentials not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Get credentials from Cloudflare Dashboard > R2 > Manage R2 API Tokens" -ForegroundColor Yellow
    Write-Host "Then run these commands before this script:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host '  $env:R2__AccountId = "your-cloudflare-account-id"' -ForegroundColor White
    Write-Host '  $env:R2__AccessKeyId = "your-r2-access-key-id"' -ForegroundColor White
    Write-Host '  $env:R2__SecretAccessKey = "your-r2-secret-access-key"' -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "[OK] R2 credentials are set" -ForegroundColor Green

if (-not $SkipCleanup) {
    Write-Host "`nCleaning up existing demo user data..." -ForegroundColor Yellow

    # Use psql via kubectl to clean up (since we have port-forward, we can also use local psql)
    $cleanupSql = @"
DELETE FROM photos WHERE stage_run_id IN (SELECT sr.stage_run_id FROM stage_runs sr JOIN cycles c ON sr.cycle_id = c.cycle_id WHERE c.user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM cleaning_materials WHERE cleaning_run_id IN (SELECT cr.cleaning_run_id FROM cleaning_runs cr JOIN stage_runs sr ON cr.stage_run_id = sr.stage_run_id JOIN cycles c ON sr.cycle_id = c.cycle_id WHERE c.user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM cleaning_runs WHERE stage_run_id IN (SELECT sr.stage_run_id FROM stage_runs sr JOIN cycles c ON sr.cycle_id = c.cycle_id WHERE c.user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM stage_materials WHERE stage_run_id IN (SELECT sr.stage_run_id FROM stage_runs sr JOIN cycles c ON sr.cycle_id = c.cycle_id WHERE c.user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM stage_run_barrels WHERE stage_run_id IN (SELECT sr.stage_run_id FROM stage_runs sr JOIN cycles c ON sr.cycle_id = c.cycle_id WHERE c.user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM stage_runs WHERE cycle_id IN (SELECT cycle_id FROM cycles WHERE user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM cycle_specimens WHERE cycle_id IN (SELECT cycle_id FROM cycles WHERE user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM cycles WHERE user_id = '00000000-0000-0000-0000-000000000003';
DELETE FROM barrels WHERE tumbler_id IN (SELECT tumbler_id FROM tumblers WHERE user_id = '00000000-0000-0000-0000-000000000003');
DELETE FROM tumblers WHERE user_id = '00000000-0000-0000-0000-000000000003';
DELETE FROM user_settings WHERE user_id = '00000000-0000-0000-0000-000000000003';
DELETE FROM users WHERE user_id = '00000000-0000-0000-0000-000000000003';
"@

    kubectl exec deployment/postgres -n myuglyrocks -- psql -U postgres -d myuglyrocks -c $cleanupSql
    Write-Host "Demo user data cleaned up" -ForegroundColor Green
}

if ($CleanupOnly) {
    Write-Host "Cleanup complete (skipping seeding)" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Starting API locally to seed data..." -ForegroundColor Cyan
Write-Host "This will upload ~200 photos to R2 - may take several minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "Watch for these log messages:" -ForegroundColor Gray
Write-Host "  'Uploading X photo sets to R2...' - Upload started" -ForegroundColor Gray
Write-Host "  'Saved X uploaded photos' - Upload complete" -ForegroundColor Gray
Write-Host ""
Write-Host "After seeding completes, press Ctrl+C to stop the API" -ForegroundColor Magenta
Write-Host ""

# Change to API directory and run
Push-Location "D:\MyRepo\MyUglyRocks-App\src\api\MyUglyRocks.Api"
try {
    dotnet run
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done! Restart the K8s API pod to pick up the new data:" -ForegroundColor Green
Write-Host "  kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks" -ForegroundColor White

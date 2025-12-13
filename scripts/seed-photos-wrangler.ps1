# seed-photos-wrangler.ps1
# Uploads demo photos to R2 using wrangler and inserts photo records into DB
# No R2 API credentials needed - uses wrangler OAuth

param(
    [switch]$CleanupPhotosOnly
)

$ErrorActionPreference = "Stop"

Write-Host "=== Demo Photo Seeding Script (Wrangler) ===" -ForegroundColor Cyan
Write-Host ""

# Check port-forward
$pgPort = netstat -an | Select-String "127.0.0.1:5432.*LISTENING"
if (-not $pgPort) {
    Write-Host "ERROR: PostgreSQL port-forward not running!" -ForegroundColor Red
    Write-Host "Run: kubectl port-forward deployment/postgres 5432:5432 -n myuglyrocks" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] PostgreSQL port-forward is running" -ForegroundColor Green

# Check photo folders
$beforeFolder = "D:\DemoRockPhotos\Before"
$afterFolder = "D:\DemoRockPhotos\After"

if (-not (Test-Path $beforeFolder)) {
    Write-Host "ERROR: Photo folder $beforeFolder not found!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $afterFolder)) {
    Write-Host "ERROR: Photo folder $afterFolder not found!" -ForegroundColor Red
    exit 1
}

$beforePhotos = Get-ChildItem $beforeFolder -Filter "*.jpg"
$afterPhotos = Get-ChildItem $afterFolder -Filter "*.jpg"
Write-Host "[OK] Found $($beforePhotos.Count) Before photos, $($afterPhotos.Count) After photos" -ForegroundColor Green

# Database connection via kubectl psql
$bucket = "dev-myuglyrocks-media"
$publicUrl = "https://pub-b409015555184d2ea808e87b602b1da5.r2.dev"

function Invoke-Psql {
    param([string]$sql)
    $result = kubectl exec deployment/postgres -n myuglyrocks -c postgres -- psql -U postgres -d myuglyrocks -t -A -c $sql 2>&1
    # Filter out the stderr "Defaulted container" message
    if ($result -is [array]) {
        $result = $result | Where-Object { $_ -notmatch "Defaulted container" }
    }
    return $result
}

# Test kubectl psql
Write-Host "Testing PostgreSQL connection via kubectl..." -ForegroundColor Yellow
$testResult = Invoke-Psql "SELECT 1"
$testValue = ($testResult | Out-String).Trim()
if ($testValue -ne "1") {
    Write-Host "ERROR: Cannot connect to PostgreSQL via kubectl. Got: $testValue" -ForegroundColor Red
    Write-Host "Make sure postgres pod is running: kubectl get pods -n myuglyrocks" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] PostgreSQL connection confirmed" -ForegroundColor Green

# Test wrangler
Write-Host "Testing wrangler R2 access..." -ForegroundColor Yellow
$testResult = npx wrangler r2 bucket list 2>&1
if ($testResult -match "dev-myuglyrocks-media") {
    Write-Host "[OK] Wrangler R2 access confirmed" -ForegroundColor Green
} else {
    Write-Host "ERROR: Wrangler R2 access failed. Run 'npx wrangler login' first" -ForegroundColor Red
    exit 1
}

# Delete existing demo photos
Write-Host "`nCleaning up existing demo photos..." -ForegroundColor Yellow
$deleteSql = @"
DELETE FROM photos WHERE stage_run_id IN (
    SELECT sr.stage_run_id FROM stage_runs sr
    JOIN cycles c ON sr.cycle_id = c.cycle_id
    WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
);
"@
$deleteResult = Invoke-Psql $deleteSql
Write-Host "Cleaned up existing demo photos" -ForegroundColor Green

if ($CleanupPhotosOnly) {
    Write-Host "Cleanup complete" -ForegroundColor Green
    exit 0
}

# Get stage runs that need photos
# Note: RunNumber is PascalCase in DB, status is int (2=Completed)
$query = @"
SELECT sr.stage_run_id, sr.stage_name, sr.status, sr.start_date_time, sr.end_date_time
FROM stage_runs sr
JOIN cycles c ON sr.cycle_id = c.cycle_id
WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
AND (
    (sr.stage_name = 'Coarse' AND sr.\"RunNumber\" = 1)
    OR (sr.stage_name = 'Fine' AND sr.status = 2)
    OR (sr.stage_name = 'Polish' AND sr.status = 2)
)
ORDER BY sr.start_date_time;
"@

$stageRunsRaw = Invoke-Psql $query
$stageRuns = @()
foreach ($line in ($stageRunsRaw -split "`n")) {
    if ($line.Trim()) {
        $parts = $line -split '\|'
        if ($parts.Count -ge 4) {
            $stageRuns += @{
                StageRunId = $parts[0]
                StageName = $parts[1]
                Status = $parts[2]
                StartDate = $parts[3]
                EndDate = if ($parts.Count -ge 5 -and $parts[4]) { $parts[4] } else { $parts[3] }
            }
        }
    }
}

Write-Host "`nFound $($stageRuns.Count) stage runs needing photos" -ForegroundColor Cyan

# Randomizer with fixed seed for reproducibility
$random = New-Object System.Random(42)

# Upload photos and insert records
$photoCount = 0

foreach ($sr in $stageRuns) {
    $stageRunId = $sr.StageRunId
    $stageName = $sr.StageName

    # Determine photo type and source folder
    # PhotoType enum: Before=0, During=1, After=2
    switch ($stageName) {
        "Coarse" { $photoType = 0; $photos = $beforePhotos }  # Before
        "Fine" { $photoType = 1; $photos = $beforePhotos }    # During
        "Polish" { $photoType = 2; $photos = $afterPhotos }   # After
    }

    # 1-2 photos per stage
    $numPhotos = $random.Next(1, 3)

    for ($i = 0; $i -lt $numPhotos; $i++) {
        $photoFile = $photos[$random.Next($photos.Count)]
        $photoId = [Guid]::NewGuid().ToString()
        $storageKey = "photos/demo/$stageRunId/$([Guid]::NewGuid().ToString('N')).jpg"

        # Upload to R2 using wrangler
        $r2Path = "$bucket/$storageKey"
        Write-Host "  [$($photoCount + 1)] $($photoFile.Name) -> $storageKey" -ForegroundColor Gray

        $uploadResult = npx wrangler r2 object put $r2Path --file $photoFile.FullName --remote 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    FAILED: $uploadResult" -ForegroundColor Red
            continue
        }

        $url = "$publicUrl/$storageKey"
        $fileSize = (Get-Item $photoFile.FullName).Length
        $photoDate = $sr.EndDate
        # Escape single quotes in file name to prevent SQL injection
        $escapedFileName = $photoFile.Name -replace "'", "''"

        # Insert photo record
        # ProcessingStatus: 1 = Completed (skip processing for seed data)
        $insertSql = @"
INSERT INTO photos (photo_id, stage_run_id, storage_key, url, file_name, mime_type, file_size_bytes, width, height, photo_type, sort_order, \"ProcessingStatus\", date_created, date_updated)
VALUES ('$photoId', '$stageRunId', '$storageKey', '$url', '$escapedFileName', 'image/jpeg', $fileSize, 800, 600, $photoType, $($i + 1), 1, '$photoDate', '$photoDate');
"@
        Invoke-Psql $insertSql | Out-Null

        $photoCount++
    }

    if ($photoCount % 20 -eq 0) {
        Write-Host "Progress: $photoCount photos uploaded..." -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "=== COMPLETE ===" -ForegroundColor Green
Write-Host "Uploaded $photoCount photos to R2" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks" -ForegroundColor White

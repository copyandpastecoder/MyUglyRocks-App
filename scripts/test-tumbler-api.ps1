$baseUrl = "https://dev.myuglyrocks.com"

# Get tumbler models (public endpoint)
$models = Invoke-RestMethod -Uri "$baseUrl/api/tumblers/models" -Method GET

Write-Host "Tumbler Models:"
$models | ForEach-Object {
    Write-Host "  - $($_.brand) $($_.model): tumblerType = '$($_.tumblerType)'"
}

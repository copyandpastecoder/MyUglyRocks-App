$content = Get-Content 'D:\MyRepo\MyUglyRocks-App\docs\seed-data\specimens-seed.csv' -Raw
$results = [regex]::Matches($content, '"([^"]{100,})"')
foreach ($m in $results) {
    $val = $m.Groups[1].Value
    $preview = if ($val.Length -gt 80) { $val.Substring(0, 80) + "..." } else { $val }
    Write-Host "Length: $($val.Length) - $preview"
}

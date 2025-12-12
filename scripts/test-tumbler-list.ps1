$baseUrl = "https://dev.myuglyrocks.com"

# Login first
$loginBody = @{
    email = "demo@myuglyrocks.com"
    password = "Demo123!"
} | ConvertTo-Json

try {
    # Create a session to store cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    # Login
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -WebSession $session

    if ($loginResponse.accessToken) {
        Write-Host "Login successful"

        # Get tumblers list
        $headers = @{
            "Authorization" = "Bearer $($loginResponse.accessToken)"
        }

        $tumblers = Invoke-RestMethod -Uri "$baseUrl/api/tumblers" -Method GET -Headers $headers

        Write-Host "`nTumblers List (TumblerListDto):"
        $tumblers | ForEach-Object {
            Write-Host "  - $($_.brand) $($_.model): tumblerType = '$($_.tumblerType)', barrelCount = $($_.barrelCount)"
        }
    } else {
        Write-Host "Login failed"
    }
} catch {
    Write-Host "Error: $_"
}

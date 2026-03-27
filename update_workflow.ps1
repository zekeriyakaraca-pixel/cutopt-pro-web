$apiKey = "[YOUR_N8N_API_KEY_HERE]" # Güvenlik nedeniyle temizlendi, buraya kendi anahtarınızı yazın.
$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type"  = "application/json"
}
$jsonBody = Get-Content "workflow_repaired.json" -Raw -Encoding UTF8
$encoding = [System.Text.Encoding]::UTF8

try {
    $response = Invoke-WebRequest -Method PUT -Uri "https://n8n-production-aed6.up.railway.app/api/v1/workflows/ji21k9Z5IWGX10Wj" -Headers $headers -Body ($encoding.GetBytes($jsonBody))
    Write-Output $response.Content
} catch {
    $errorResp = $_.Exception.Response
    if ($null -ne $errorResp) {
        $errorStream = $errorResp.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorText = $reader.ReadToEnd()
        Write-Output "Error Body: $errorText"
    } else {
        Write-Output "Error: $($_.Exception.Message)"
    }
    Write-Error $_.Exception.Message
}

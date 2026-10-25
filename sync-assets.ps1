# Sync Web Assets to Android and iOS projects
$files = @("index.html", "script.js", "style.css", "logo.png", "favicon.png", "manifest.json", "sw.js")

Write-Host "Syncing web assets to Android and iOS projects..." -ForegroundColor Cyan

foreach ($file in $files) {
    if (Test-Path $file) {
        Copy-Item $file -Destination "android\app\src\main\assets\$file" -Force
        Copy-Item $file -Destination "ios\ExpenseTracker\www\$file" -Force
        Write-Host "  -> Synced: $file" -ForegroundColor Green
    }
}

Write-Host "Assets successfully synced to Android & iOS!" -ForegroundColor Green

# MGM Museum - Clean Server Restart Script
# This script stops the server, clears caches, and restarts

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "MGM Museum - Clean Server Restart" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

# Step 1: Kill any process on port 3000
Write-Host "Step 1: Checking for processes on port 3000..." -ForegroundColor Yellow
$processes = netstat -ano | Select-String ":3000" | ForEach-Object {
    $_.ToString().Trim() -split '\s+' | Select-Object -Last 1
} | Sort-Object -Unique

if ($processes) {
    Write-Host "Found processes on port 3000. Stopping them..." -ForegroundColor Yellow
    foreach ($processId in $processes) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $processId" -ForegroundColor Green
        } catch {
            Write-Host "  Process $processId already stopped" -ForegroundColor Gray
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  No processes found on port 3000" -ForegroundColor Green
}

# Step 2: Clear Next.js cache
Write-Host "`nStep 2: Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host "  .next cache cleared successfully" -ForegroundColor Green
    } catch {
        Write-Host "  Could not clear cache (files may be in use)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No cache found (first run)" -ForegroundColor Green
}

# Step 3: Clear Turbopack cache
Write-Host "`nStep 3: Clearing Turbopack cache..." -ForegroundColor Yellow
if (Test-Path ".turbopack") {
    try {
        Remove-Item -Recurse -Force .turbopack -ErrorAction Stop
        Write-Host "  .turbopack cache cleared successfully" -ForegroundColor Green
    } catch {
        Write-Host "  Could not clear turbopack cache" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No turbopack cache found" -ForegroundColor Green
}

# Step 4: Wait a moment
Write-Host "`nStep 4: Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Write-Host "  Ready to restart" -ForegroundColor Green

# Step 5: Start the dev server
Write-Host "`nStep 5: Starting development server..." -ForegroundColor Yellow
Write-Host "  Running: npm run dev" -ForegroundColor Cyan
Write-Host "`n=================================`n" -ForegroundColor Cyan

npm run dev


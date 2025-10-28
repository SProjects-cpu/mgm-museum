# Add all environment variables to Vercel
Write-Host "Setting up environment variables in Vercel..." -ForegroundColor Green

# Create temp files with values
$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://mlljzwuflbbquttejvuq.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDcxMDQsImV4cCI6MjA3NTgyMzEwNH0.YxYyWd2-6dSytqTv92KfeMkf1wSWeoCLYNY1NCuF7dw"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU"
    "SUPABASE_STORAGE_BUCKET" = "mgm-museum-storage"
    "RESEND_API_KEY" = "re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE"
    "FROM_EMAIL" = "MGM Science Centre <noreply@mgmapjscicentre.org>"
    "NEXT_PUBLIC_APP_URL" = "https://mgm-museum.vercel.app"
    "NEXT_PUBLIC_SITE_URL" = "https://mgm-museum.vercel.app"
    "NEXT_PUBLIC_GRAPHQL_ENDPOINT" = "https://mgm-museum.vercel.app/api/graphql"
    "NODE_ENV" = "production"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "`nAdding $key..." -ForegroundColor Yellow
    
    # Create temp file with value
    $tempFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempFile -Value $value -NoNewline
    
    # Add to Vercel using file input
    Get-Content $tempFile | vercel env add $key production
    
    # Cleanup
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    Write-Host "✓ Added $key" -ForegroundColor Green
}

Write-Host "`n✨ All environment variables added!" -ForegroundColor Green
Write-Host "🔄 Now redeploying..." -ForegroundColor Cyan

# Trigger redeploy
vercel --prod --yes

Write-Host "`n✅ Done! Your site should now be working." -ForegroundColor Green

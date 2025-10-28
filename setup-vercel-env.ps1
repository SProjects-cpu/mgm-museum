Write-Host "Setting up Vercel environment variables..." -ForegroundColor Green

$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://mlljzwuflbbquttejvuq.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDcxMDQsImV4cCI6MjA3NTgyMzEwNH0.YxYyWd2-6dSytqTv92KfeMkf1wSWeoCLYNY1NCuF7dw"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU"
    "RESEND_API_KEY" = "re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE"
    "NEXT_PUBLIC_APP_URL" = "https://mgm-museum.vercel.app"
    "NEXT_PUBLIC_SITE_URL" = "https://mgm-museum.vercel.app"
    "NEXT_PUBLIC_GRAPHQL_ENDPOINT" = "https://mgm-museum.vercel.app/api/graphql"
    "NODE_ENV" = "production"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Adding $key..." -ForegroundColor Yellow
    $tempFile = New-TemporaryFile
    Set-Content -Path $tempFile.FullName -Value $value -NoNewline
    Get-Content $tempFile.FullName | vercel env add $key production
    Remove-Item $tempFile.FullName
}

Write-Host "Done! Redeploying now..." -ForegroundColor Green
vercel --prod --yes

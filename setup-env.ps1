# MGM Museum - Environment Setup Script (PowerShell)
# Run this script to create your .env.local file

$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mlljzwuflbbquttejvuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDcxMDQsImV4cCI6MjA3NTgyMzEwNH0.YxYyWd2-6dSytqTv92KfeMkf1wSWeoCLYNY1NCuF7dw
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# GraphQL API
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3000/api/graphql

# Email Service (Resend) - Optional for now
RESEND_API_KEY=
FROM_EMAIL=noreply@mgmapjscicentre.org

# Payment Gateway (Razorpay) - Optional for now  
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Google Maps - Optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=MGM APJ Abdul Kalam Astrospace Science Centre

# File Storage
NEXT_PUBLIC_STORAGE_URL=https://mlljzwuflbbquttejvuq.supabase.co/storage/v1

# Feature Flags
ENABLE_PAYMENTS=false
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_REALTIME_UPDATES=true

# Environment
NODE_ENV=development
"@

# Create .env.local file
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ .env.local file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to add the SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/mlljzwuflbbquttejvuq/settings/api" -ForegroundColor Cyan
Write-Host "2. Copy the 'service_role' key (NOT the anon key)" -ForegroundColor Cyan
Write-Host "3. Edit .env.local and replace 'your-service-role-key-here' with the actual key" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Apply database migrations (see instructions below)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White







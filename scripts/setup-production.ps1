# ================================================
# Production Setup Script for Windows (PowerShell)
# ================================================
# This script validates environment variables and prepares the app for production

Write-Host "🚀 MGM Museum - Production Setup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if environment variable is set
function Test-EnvVar {
    param (
        [string]$VarName,
        [bool]$Required = $true
    )
    
    $value = [Environment]::GetEnvironmentVariable($VarName)
    
    if ([string]::IsNullOrEmpty($value)) {
        if ($Required) {
            Write-Host "❌ Missing required variable: $VarName" -ForegroundColor Red
            return $false
        } else {
            Write-Host "⚠️  Optional variable not set: $VarName" -ForegroundColor Yellow
            return $true
        }
    } else {
        Write-Host "✓ $VarName is set" -ForegroundColor Green
        return $true
    }
}

# Step 1: Validate Required Environment Variables
Write-Host "📋 Step 1: Validating Environment Variables" -ForegroundColor Yellow
Write-Host ""

$allValid = $true

# Required variables
$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL"
)

foreach ($var in $requiredVars) {
    if (-not (Test-EnvVar -VarName $var -Required $true)) {
        $allValid = $false
    }
}

# Optional variables
$optionalVars = @(
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "TWILIO_ACCOUNT_SID",
    "SMTP_HOST"
)

foreach ($var in $optionalVars) {
    Test-EnvVar -VarName $var -Required $false | Out-Null
}

Write-Host ""

if (-not $allValid) {
    Write-Host "❌ Environment validation failed! Please set all required variables." -ForegroundColor Red
    Write-Host "   Refer to .env.production for the complete list." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All required environment variables are set!" -ForegroundColor Green
Write-Host ""

# Step 2: Install Dependencies
Write-Host "📦 Step 2: Installing Dependencies" -ForegroundColor Yellow
Write-Host ""

try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Build Application
Write-Host "🏗️  Step 3: Building Application" -ForegroundColor Yellow
Write-Host ""

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✅ Application built successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Service Connectivity Checks
Write-Host "🔌 Step 4: Testing Service Connectivity" -ForegroundColor Yellow
Write-Host ""

# Test Supabase connection
$supabaseUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL")
if ($supabaseUrl) {
    try {
        $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✓ Supabase connection successful" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Supabase connection check failed (this may be normal for some configurations)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Summary
Write-Host "✅ Production Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review .env.production and ensure all values are correct" -ForegroundColor White
Write-Host "  2. Deploy to Vercel using: vercel --prod" -ForegroundColor White
Write-Host "  3. Run verification: npm run verify:deployment" -ForegroundColor White
Write-Host ""

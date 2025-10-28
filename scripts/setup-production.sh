#!/bin/bash

# ================================================
# Production Setup Script for Unix/Linux/macOS
# ================================================
# This script validates environment variables and prepares the app for production

set -e

echo "🚀 MGM Museum - Production Setup Script"
echo "========================================="
echo ""

# Function to check if environment variable is set
check_env_var() {
    local var_name=$1
    local required=$2
    
    if [ -z "${!var_name}" ]; then
        if [ "$required" = "true" ]; then
            echo "❌ Missing required variable: $var_name"
            return 1
        else
            echo "⚠️  Optional variable not set: $var_name"
            return 0
        fi
    else
        echo "✓ $var_name is set"
        return 0
    fi
}

# Step 1: Validate Required Environment Variables
echo "📋 Step 1: Validating Environment Variables"
echo ""

all_valid=true

# Required variables
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "RESEND_API_KEY"
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_SITE_URL"
)

for var in "${required_vars[@]}"; do
    if ! check_env_var "$var" "true"; then
        all_valid=false
    fi
done

# Optional variables
optional_vars=(
    "NEXT_PUBLIC_RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
    "TWILIO_ACCOUNT_SID"
    "SMTP_HOST"
)

for var in "${optional_vars[@]}"; do
    check_env_var "$var" "false" > /dev/null || true
done

echo ""

if [ "$all_valid" = false ]; then
    echo "❌ Environment validation failed! Please set all required variables."
    echo "   Refer to .env.production for the complete list."
    exit 1
fi

echo "✅ All required environment variables are set!"
echo ""

# Step 2: Install Dependencies
echo "📦 Step 2: Installing Dependencies"
echo ""

if npm install; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Step 3: Build Application
echo "🏗️  Step 3: Building Application"
echo ""

if npm run build; then
    echo "✅ Application built successfully!"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""

# Step 4: Service Connectivity Checks
echo "🔌 Step 4: Testing Service Connectivity"
echo ""

# Test Supabase connection
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    if curl -s -f -m 10 "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
        echo "✓ Supabase connection successful"
    else
        echo "⚠️  Supabase connection check failed (this may be normal for some configurations)"
    fi
fi

echo ""

# Summary
echo "✅ Production Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Review .env.production and ensure all values are correct"
echo "  2. Deploy to Vercel using: vercel --prod"
echo "  3. Run verification: npm run verify:deployment"
echo ""

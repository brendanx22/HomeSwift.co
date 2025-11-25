# HomeSwift - Quick Fix Script (PowerShell)
# Run this to apply immediate fixes for critical issues

Write-Host "🚀 HomeSwift Quick Fix Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 2: Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
    
    # Check if sw.js was copied
    if (Test-Path "dist/sw.js") {
        Write-Host "✅ Service worker file found in dist/" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Service worker not found in dist/ - copying manually..." -ForegroundColor Yellow
        if (Test-Path "public/sw.js") {
            Copy-Item "public/sw.js" "dist/sw.js"
            Write-Host "✅ Service worker copied" -ForegroundColor Green
        } else {
            Write-Host "❌ public/sw.js not found" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 3: Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_SUPABASE_URL" -and $envContent -match "VITE_SUPABASE_ANON_KEY") {
        Write-Host "✅ Supabase environment variables found" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing Supabase environment variables" -ForegroundColor Red
        Write-Host "   Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Please create .env file with required variables" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 4: Checking critical files..." -ForegroundColor Yellow

$criticalFiles = @(
    "src/lib/supabaseClient.js",
    "src/contexts/AuthContext.jsx",
    "src/pages/SavedProperties.jsx",
    "src/lib/propertyAPI.js",
    "public/sw.js"
)

$allFilesExist = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NOT FOUND" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""
Write-Host "📋 Step 5: Checking SQL scripts..." -ForegroundColor Yellow
if (Test-Path "sql/fix_saved_properties_performance.sql") {
    Write-Host "✅ Performance fix SQL script found" -ForegroundColor Green
    Write-Host "⚠️  Remember to run this in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "   sql/fix_saved_properties_performance.sql" -ForegroundColor Cyan
} else {
    Write-Host "❌ SQL script not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "🎉 Quick fix script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the SQL script in Supabase (sql/fix_saved_properties_performance.sql)"
Write-Host "2. Configure Google OAuth (see GOOGLE_AUTH_SETUP.md)"
Write-Host "3. Deploy the new build (dist/ folder)"
Write-Host "4. Test the application"
Write-Host ""
Write-Host "📚 For more details, see:" -ForegroundColor Cyan
Write-Host "   - GOOGLE_AUTH_SETUP.md"
Write-Host "   - MISSING_FEATURES.md"
Write-Host ""

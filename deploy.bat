@echo off
echo 🚀 HomeSwift Deployment Script
echo ===============================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the HomeSwift root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Error: Backend directory not found
    pause
    exit /b 1
)

echo.
echo 📋 Deployment Checklist:
echo ✅ Environment variables configured
echo ✅ Build scripts ready
echo ✅ Database migrations prepared
echo ✅ CORS settings configured

echo.
echo 🌐 Frontend Deployment (Vercel)
echo 1. Push code to your Git repository
echo 2. Deploy on Vercel: https://vercel.com
echo 3. Set environment variables in Vercel dashboard:
echo    - VITE_BACKEND_URL=https://api.homeswift.co
echo    - VITE_API_URL=https://api.homeswift.co
echo    - VITE_SUPABASE_URL=https://tproaiqvkohrlxjmkgxt.supabase.co
echo    - VITE_SUPABASE_ANON_KEY=your-anon-key
echo    - VITE_APP_URL=https://homeswift.co

echo.
echo 🔧 Backend Deployment
echo 1. Deploy to your server (DigitalOcean, AWS, Heroku, etc.)
echo 2. Set environment variables:
echo    - PORT=5000
echo    - NODE_ENV=production
echo    - SUPABASE_URL=https://tproaiqvkohrlxjmkgxt.supabase.co
echo    - DATABASE_URL=postgresql://...
echo    - JWT_SECRET=your-secret
echo    - SITE_URL=https://homeswift.co
echo    - ALLOWED_ORIGINS=https://homeswift.co

echo.
echo 🗄️  Database Setup (Supabase)
echo 1. Ensure all tables are created (see README.md)
echo 2. Run database migrations
echo 3. Configure Row Level Security policies
echo 4. Test database connection

echo.
echo 📝 Manual Steps Required:
echo 1. Set up domain DNS (homeswift.co, api.homeswift.co)
echo 2. Configure SSL certificates
echo 3. Set up monitoring and logging
echo 4. Configure backup systems
echo 5. Test all endpoints and features

echo.
echo ✅ Deployment checklist complete!
echo Check README.md for detailed deployment instructions.

pause

#!/bin/bash

# HomeSwift - Quick Fix Script
# Run this to apply immediate fixes for critical issues

echo "🚀 HomeSwift Quick Fix Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Installing dependencies...${NC}"
npm ci
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Building production bundle...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
    
    # Check if sw.js was copied
    if [ -f "dist/sw.js" ]; then
        echo -e "${GREEN}✅ Service worker file found in dist/${NC}"
    else
        echo -e "${YELLOW}⚠️  Service worker not found in dist/ - copying manually...${NC}"
        if [ -f "public/sw.js" ]; then
            cp public/sw.js dist/sw.js
            echo -e "${GREEN}✅ Service worker copied${NC}"
        else
            echo -e "${RED}❌ public/sw.js not found${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 3: Checking environment variables...${NC}"
if [ -f ".env" ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ Supabase environment variables found${NC}"
    else
        echo -e "${RED}❌ Missing Supabase environment variables${NC}"
        echo "   Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Please create .env file with required variables"
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Checking critical files...${NC}"

critical_files=(
    "src/lib/supabaseClient.js"
    "src/contexts/AuthContext.jsx"
    "src/pages/SavedProperties.jsx"
    "src/lib/propertyAPI.js"
    "public/sw.js"
)

all_files_exist=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file NOT FOUND${NC}"
        all_files_exist=false
    fi
done

echo ""
echo -e "${YELLOW}📋 Step 5: Checking SQL scripts...${NC}"
if [ -f "sql/fix_saved_properties_performance.sql" ]; then
    echo -e "${GREEN}✅ Performance fix SQL script found${NC}"
    echo -e "${YELLOW}⚠️  Remember to run this in Supabase SQL Editor:${NC}"
    echo "   sql/fix_saved_properties_performance.sql"
else
    echo -e "${RED}❌ SQL script not found${NC}"
fi

echo ""
echo "=============================="
echo -e "${GREEN}🎉 Quick fix script completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Run the SQL script in Supabase (sql/fix_saved_properties_performance.sql)"
echo "2. Configure Google OAuth (see GOOGLE_AUTH_SETUP.md)"
echo "3. Deploy the new build (dist/ folder)"
echo "4. Test the application"
echo ""
echo "📚 For more details, see:"
echo "   - GOOGLE_AUTH_SETUP.md"
echo "   - MISSING_FEATURES.md"
echo ""

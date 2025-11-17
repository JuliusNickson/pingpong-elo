#!/bin/bash

echo "🔍 PWA Configuration Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        return 0
    else
        echo -e "${RED}✗${NC} $3"
        return 1
    fi
}

errors=0

# Check source files
echo "📁 Source Files:"
check_file "public/manifest.json" "PWA manifest exists" || ((errors++))
check_file "public/service-worker.js" "Service worker exists" || ((errors++))
check_dir "public/icons" "Icons directory exists" || ((errors++))
check_file "public/icons/icon-192.png" "192x192 icon exists" || ((errors++))
check_file "public/icons/icon-512.png" "512x512 icon exists" || ((errors++))
check_file "scripts/inject-pwa.js" "PWA injection script exists" || ((errors++))
echo ""

# Check manifest content
echo "📋 Manifest Configuration:"
check_content "public/manifest.json" "short_name" "Manifest has short_name" || ((errors++))
check_content "public/manifest.json" "icons" "Manifest has icons" || ((errors++))
check_content "public/manifest.json" "start_url" "Manifest has start_url" || ((errors++))
check_content "public/manifest.json" "display.*standalone" "Manifest display mode: standalone" || ((errors++))
check_content "public/manifest.json" "theme_color" "Manifest has theme_color" || ((errors++))
echo ""

# Check app.json
echo "⚙️  App Configuration:"
check_content "app.json" "output.*static" "Web output: static" || ((errors++))
check_content "app.json" "bundler.*metro" "Web bundler: metro" || ((errors++))
check_content "app.json" "display.*standalone" "Web display: standalone" || ((errors++))
echo ""

# Check package.json scripts
echo "📦 Build Scripts:"
check_content "package.json" "build:web" "build:web script exists" || ((errors++))
check_content "package.json" "serve:web" "serve:web script exists" || ((errors++))
check_content "package.json" "inject-pwa" "PWA injection in build" || ((errors++))
echo ""

# Check built files (if dist exists)
if [ -d "dist" ]; then
    echo "🏗️  Built Files:"
    check_file "dist/manifest.json" "Manifest copied to dist" || ((errors++))
    check_file "dist/service-worker.js" "Service worker copied to dist" || ((errors++))
    check_file "dist/icons/icon-192.png" "192x192 icon in dist" || ((errors++))
    check_file "dist/icons/icon-512.png" "512x512 icon in dist" || ((errors++))
    check_file "dist/index.html" "index.html in dist" || ((errors++))
    
    echo ""
    echo "🔗 PWA Injection:"
    check_content "dist/index.html" "manifest.json" "Manifest linked in HTML" || ((errors++))
    check_content "dist/index.html" "serviceWorker" "Service worker registration in HTML" || ((errors++))
    check_content "dist/index.html" "apple-mobile-web-app" "Apple meta tags in HTML" || ((errors++))
    check_content "dist/index.html" "theme-color" "Theme color meta tag in HTML" || ((errors++))
    echo ""
else
    echo -e "${YELLOW}⚠${NC} dist/ folder not found. Run 'npm run build:web' first."
    echo ""
fi

# Check for removed files
echo "🧹 Cleanup Status:"
if [ ! -f "utils/database.js" ]; then
    echo -e "${GREEN}✓${NC} database.js removed"
else
    echo -e "${RED}✗${NC} database.js still exists (should be removed)"
    ((errors++))
fi

if [ ! -f "utils/storage.js" ]; then
    echo -e "${GREEN}✓${NC} storage.js removed"
else
    echo -e "${RED}✗${NC} storage.js still exists (should be removed)"
    ((errors++))
fi

if [ ! -f "utils/sync.js" ]; then
    echo -e "${GREEN}✓${NC} sync.js removed"
else
    echo -e "${RED}✗${NC} sync.js still exists (should be removed)"
    ((errors++))
fi
echo ""

# Check dependencies
echo "📚 Dependencies:"
if ! grep -q "expo-sqlite" package.json; then
    echo -e "${GREEN}✓${NC} expo-sqlite removed from package.json"
else
    echo -e "${RED}✗${NC} expo-sqlite still in package.json (should be removed)"
    ((errors++))
fi

if grep -q "firebase" package.json; then
    echo -e "${GREEN}✓${NC} Firebase installed"
else
    echo -e "${YELLOW}⚠${NC} Firebase not found in package.json"
fi
echo ""

# Summary
echo "=================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! PWA is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. npm run build:web    # Build PWA"
    echo "  2. npm run serve:web    # Test locally"
    echo "  3. Open http://localhost:8080"
    echo "  4. Test 'Add to Home Screen'"
    echo "  5. Deploy dist/ folder"
else
    echo -e "${RED}❌ Found $errors issue(s)${NC}"
    echo ""
    echo "Fix the issues above and run this script again."
fi
echo ""

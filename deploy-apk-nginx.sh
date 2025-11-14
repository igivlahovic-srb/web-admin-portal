#!/bin/bash

echo "=========================================="
echo "Deploy APK to Nginx"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/lafantana-whs"
APK_DIR="$APP_DIR/apk"
API_DIR="$APP_DIR/api"
WORKSPACE="/home/user/workspace"
DOMAIN="appserver.lafantanasrb.local"

# Get version from app.json
VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$WORKSPACE/app.json")
if [ -z "$VERSION" ]; then
    echo -e "${RED}✗ Could not read version from app.json${NC}"
    exit 1
fi

APK_SOURCE="$WORKSPACE/android/app/build/outputs/apk/release/app-release.apk"
APK_FILENAME="lafantana-whs-v${VERSION}.apk"
APK_DEST="$APK_DIR/$APK_FILENAME"

echo -e "${YELLOW}Deploying version: $VERSION${NC}"
echo ""

# Check if APK exists
if [ ! -f "$APK_SOURCE" ]; then
    echo -e "${RED}✗ APK not found: $APK_SOURCE${NC}"
    echo ""
    echo "Build APK first:"
    echo "  ./build-apk.sh"
    exit 1
fi

APK_SIZE=$(du -h "$APK_SOURCE" | cut -f1)
echo -e "${GREEN}✓ APK found ($APK_SIZE)${NC}"

echo ""
echo "Step 1: Copying APK..."
sudo cp "$APK_SOURCE" "$APK_DEST"
sudo chown www-data:www-data "$APK_DEST"
sudo chmod 644 "$APK_DEST"

# Create symlink to latest
sudo ln -sf "$APK_FILENAME" "$APK_DIR/latest.apk"

echo -e "${GREEN}✓ APK deployed${NC}"

echo ""
echo "Step 2: Copy certificate for mobile app..."
sudo cp /etc/nginx/ssl/lafantana-whs.crt "$APK_DIR/"
sudo chown www-data:www-data "$APK_DIR/lafantana-whs.crt"
sudo chmod 644 "$APK_DIR/lafantana-whs.crt"

echo -e "${GREEN}✓ Certificate copied${NC}"

echo ""
echo "Step 3: Updating API endpoint..."

# Update API response
cat > /tmp/mobile-app.json << EOF
{
  "success": true,
  "data": {
    "hasApk": true,
    "latestVersion": "$VERSION",
    "downloadUrl": "https://$DOMAIN/download/$APK_FILENAME",
    "directDownloadUrl": "https://$DOMAIN/download/latest.apk",
    "certificateUrl": "https://$DOMAIN/download/lafantana-whs.crt",
    "fileSize": "$APK_SIZE",
    "releaseDate": "$(date -Iseconds)",
    "message": "Nova verzija dostupna za preuzimanje"
  }
}
EOF

sudo mv /tmp/mobile-app.json "$API_DIR/mobile-app.json"
sudo chown www-data:www-data "$API_DIR/mobile-app.json"
sudo chmod 644 "$API_DIR/mobile-app.json"

echo -e "${GREEN}✓ API updated${NC}"

echo ""
echo "Step 4: Cleaning old versions (keeping last 5)..."
cd "$APK_DIR"
ls -t lafantana-whs-v*.apk 2>/dev/null | tail -n +6 | xargs -r sudo rm
echo -e "${GREEN}✓ Cleanup complete${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo "=========================================="
echo ""
echo "APK Info:"
echo "  Version: $VERSION"
echo "  Size: $APK_SIZE"
echo "  File: $APK_FILENAME"
echo ""
echo "Download URLs:"
echo "  HTTPS: https://$DOMAIN/download/latest.apk"
echo "  Versioned: https://$DOMAIN/download/$APK_FILENAME"
echo "  Certificate: https://$DOMAIN/download/lafantana-whs.crt"
echo ""
echo "Test API:"
echo "  curl -k https://$DOMAIN/api/mobile-app.json"
echo ""
echo "Available versions:"
ls -lh "$APK_DIR"/*.apk 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "⚠️  Note: Mobile users must install certificate first:"
echo "   1. Download: https://$DOMAIN/download/lafantana-whs.crt"
echo "   2. Install in Android Settings → Security → Install from storage"
echo ""

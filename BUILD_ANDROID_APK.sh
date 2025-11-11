#!/bin/bash
# Android APK Build Script za Ubuntu Server
# Builds APK i upload-uje na web portal

set -e

echo "================================================"
echo "La Fantana WHS - Android APK Build"
echo "================================================"
echo ""

# Configuration
MOBILE_APP_DIR="$HOME/webadminportal"
WEB_ADMIN_DIR="$HOME/webadminportal/web-admin"
APK_OUTPUT_DIR="$WEB_ADMIN_DIR/public/apk"

# Check if directories exist
if [ ! -d "$MOBILE_APP_DIR" ]; then
    echo "❌ Mobile app directory not found: $MOBILE_APP_DIR"
    exit 1
fi

cd "$MOBILE_APP_DIR"

echo "Step 1/6: Reading version from app.json..."
VERSION=$(grep -Po '"version": "\K[^"]*' app.json)
if [ -z "$VERSION" ]; then
    echo "❌ Could not read version from app.json"
    exit 1
fi
echo "✓ Version: $VERSION"
echo ""

echo "Step 2/6: Checking dependencies..."
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi
echo "✓ Dependencies OK"
echo ""

echo "Step 3/6: Installing mobile app dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

echo "Step 4/6: Building Android APK with EAS..."
echo "This will take 5-10 minutes..."

# Build APK using EAS Build
npx eas-cli build --platform android --profile production --local --non-interactive

if [ $? -ne 0 ]; then
    echo "❌ EAS Build failed!"
    echo ""
    echo "If this is the first build, you need to:"
    echo "1. Install EAS CLI: npm install -g eas-cli"
    echo "2. Login: eas login"
    echo "3. Configure: eas build:configure"
    exit 1
fi

echo "✓ Build completed"
echo ""

echo "Step 5/6: Moving APK to web portal..."
mkdir -p "$APK_OUTPUT_DIR"

# Find the built APK (EAS creates it in current directory or build folder)
APK_FILE=$(find . -name "*.apk" -type f -mmin -30 | head -1)

if [ -z "$APK_FILE" ]; then
    echo "❌ APK file not found after build!"
    echo "Searching in common locations..."
    find . -name "*.apk" -type f
    exit 1
fi

# Copy APK with version name
cp "$APK_FILE" "$APK_OUTPUT_DIR/lafantana-v${VERSION}.apk"
echo "✓ APK copied to: $APK_OUTPUT_DIR/lafantana-v${VERSION}.apk"
echo ""

echo "Step 6/6: Setting permissions..."
chmod 644 "$APK_OUTPUT_DIR/lafantana-v${VERSION}.apk"
echo "✓ Permissions set"
echo ""

echo "================================================"
echo "✅ BUILD COMPLETED!"
echo "================================================"
echo ""
echo "APK Location: $APK_OUTPUT_DIR/lafantana-v${VERSION}.apk"
echo "Version: $VERSION"
echo "Size: $(du -h "$APK_OUTPUT_DIR/lafantana-v${VERSION}.apk" | cut -f1)"
echo ""
echo "Download URL:"
echo "http://appserver.lafantanasrb.local:3002/apk/lafantana-v${VERSION}.apk"
echo ""
echo "Users can now download this APK from the web portal!"
echo ""

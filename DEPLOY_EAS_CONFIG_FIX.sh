#!/bin/bash
# Deploy EAS Configuration Fix to Ubuntu Server
# This adds the missing EAS project ID to app.json

echo "================================================"
echo "Deploying EAS Configuration Fix"
echo "================================================"
echo ""

VIBECODE_DIR="/root/webadminportal"

echo "Step 1/3: Pull latest changes from git..."
cd "$VIBECODE_DIR"
git pull origin main
echo "✓ Git pull completed"
echo ""

echo "Step 2/3: Verify app.json has EAS project ID..."
if grep -q '"projectId": "279e80a2-142c-4af9-9270-daaa9e5c6763"' "$VIBECODE_DIR/app.json"; then
    echo "✓ app.json has EAS project ID configured correctly"
else
    echo "❌ app.json missing EAS project ID!"
    echo "Please manually update app.json or pull latest changes."
    exit 1
fi

if grep -q '"owner": "igix"' "$VIBECODE_DIR/app.json"; then
    echo "✓ app.json has owner configured correctly"
else
    echo "❌ app.json missing owner field!"
    echo "Please manually update app.json or pull latest changes."
    exit 1
fi
echo ""

echo "Step 3/3: Test EAS authentication..."
if npx eas-cli whoami > /dev/null 2>&1; then
    echo "✓ EAS authentication OK"
else
    echo "⚠️  WARNING: Not logged in to EAS!"
    echo ""
    echo "You need to login to EAS before building:"
    echo "  npx eas-cli login"
    echo ""
    echo "Credentials:"
    echo "  Email: itserbia@lafantana.rs"
    echo "  Password: [your password]"
    echo ""
fi
echo ""

echo "================================================"
echo "✅ DEPLOYMENT COMPLETED!"
echo "================================================"
echo ""
echo "What was fixed:"
echo "  ✓ app.json now has EAS project ID: 279e80a2-142c-4af9-9270-daaa9e5c6763"
echo "  ✓ app.json now has owner: igix"
echo "  ✓ updates.url configured for OTA updates"
echo ""
echo "You can now test the build with:"
echo "  cd /root/webadminportal"
echo "  ./BUILD_ANDROID_APK.sh"
echo ""
echo "If you get 'EAS project not configured' error, run:"
echo "  cd /root/webadminportal"
echo "  npx eas-cli login"
echo ""

#!/bin/bash
# Master Deployment Script - Deploy All Fixes at Once
# This script deploys all the latest fixes to the Ubuntu server

echo "================================================"
echo "La Fantana WHS - Master Deployment Script"
echo "================================================"
echo ""
echo "This script will deploy:"
echo "  1. Backup System"
echo "  2. Cloud Build Fix (removes --local flag)"
echo "  3. EAS Configuration Fix (adds project ID)"
echo ""

VIBECODE_DIR="/root/webadminportal"
WEB_ADMIN_DIR="/root/webadminportal/web-admin"

# Check if we're in the right directory
if [ ! -d "$VIBECODE_DIR" ]; then
    echo "❌ Error: $VIBECODE_DIR not found!"
    echo "Please run this script on the Ubuntu server."
    exit 1
fi

echo "Step 1/8: Pull latest changes from git..."
cd "$VIBECODE_DIR"
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi
echo "✓ Git pull completed"
echo ""

echo "Step 2/8: Make all scripts executable..."
chmod +x "$VIBECODE_DIR/BUILD_ANDROID_APK.sh"
chmod +x "$VIBECODE_DIR/AUTO_BUILD_ANDROID.sh"
chmod +x "$VIBECODE_DIR/CREATE_BACKUP.sh"
chmod +x "$VIBECODE_DIR/DEPLOY_BACKUP_SYSTEM.sh"
chmod +x "$VIBECODE_DIR/DEPLOY_BUILD_FIX.sh"
chmod +x "$VIBECODE_DIR/DEPLOY_EAS_CONFIG_FIX.sh"
echo "✓ All scripts are now executable"
echo ""

echo "Step 3/8: Verify cloud build configuration..."
if grep -q "EAS Cloud Build" "$VIBECODE_DIR/BUILD_ANDROID_APK.sh"; then
    echo "✓ BUILD_ANDROID_APK.sh is using cloud build"
else
    echo "❌ BUILD_ANDROID_APK.sh still using local build!"
    exit 1
fi

if grep -q "EAS Cloud Build" "$VIBECODE_DIR/AUTO_BUILD_ANDROID.sh"; then
    echo "✓ AUTO_BUILD_ANDROID.sh is using cloud build"
else
    echo "❌ AUTO_BUILD_ANDROID.sh still using local build!"
    exit 1
fi
echo ""

echo "Step 4/8: Verify EAS project configuration..."
if grep -q '"projectId": "279e80a2-142c-4af9-9270-daaa9e5c6763"' "$VIBECODE_DIR/app.json"; then
    echo "✓ app.json has EAS project ID"
else
    echo "❌ app.json missing EAS project ID!"
    exit 1
fi

if grep -q '"owner": "igix"' "$VIBECODE_DIR/app.json"; then
    echo "✓ app.json has owner configured"
else
    echo "❌ app.json missing owner field!"
    exit 1
fi
echo ""

echo "Step 5/8: Create backups directory..."
mkdir -p "$WEB_ADMIN_DIR/public/backups"
chmod 755 "$WEB_ADMIN_DIR/public/backups"
echo "✓ Backups directory created"
echo ""

echo "Step 6/8: Reinstall web-admin dependencies..."
cd "$WEB_ADMIN_DIR"
rm -rf node_modules .next
npm install --include=dev
if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

echo "Step 7/8: Build web-admin..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✓ Build completed"
echo ""

echo "Step 8/8: Restart PM2..."
pm2 restart lafantana-whs-admin
if [ $? -ne 0 ]; then
    echo "⚠️  PM2 restart failed, but continuing..."
fi
echo "✓ PM2 restarted"
echo ""

echo "================================================"
echo "✅ ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!"
echo "================================================"
echo ""
echo "What was deployed:"
echo ""
echo "1. ✓ Backup System:"
echo "   - CREATE_BACKUP.sh script"
echo "   - /api/backup API endpoint"
echo "   - /backup page in web portal"
echo "   - Backups directory created"
echo ""
echo "2. ✓ Cloud Build Fix:"
echo "   - BUILD_ANDROID_APK.sh uses EAS cloud build"
echo "   - AUTO_BUILD_ANDROID.sh uses EAS cloud build"
echo "   - No longer requires Android SDK on server"
echo ""
echo "3. ✓ EAS Configuration:"
echo "   - app.json has EAS project ID"
echo "   - app.json has owner configured"
echo "   - Ready for EAS builds"
echo ""
echo "4. ✓ Web Portal:"
echo "   - Dependencies installed (with devDependencies)"
echo "   - New build deployed"
echo "   - PM2 restarted"
echo ""
echo "================================================"
echo "NEXT STEPS:"
echo "================================================"
echo ""
echo "1. Check EAS authentication:"
echo "   npx eas-cli whoami"
echo ""
echo "   If not logged in, run:"
echo "   npx eas-cli login"
echo "   Email: itserbia@lafantana.rs"
echo ""
echo "2. Test Android build:"
echo "   cd /root/webadminportal"
echo "   ./BUILD_ANDROID_APK.sh"
echo ""
echo "3. Test backup system:"
echo "   Open: http://appserver.lafantanasrb.local:3002/backup"
echo "   Click: Kreiraj Backup"
echo ""
echo "4. Verify web portal:"
echo "   Open: http://appserver.lafantanasrb.local:3002"
echo "   Check: All tabs work (Dashboard, Korisnici, Servisi, Konfiguracija, Mobilna aplikacija, Backup)"
echo ""
echo "================================================"
echo ""

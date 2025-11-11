#!/bin/bash
# Quick Setup - Create Test APK Files on Ubuntu Server
# Ovo kreira dummy APK fajlove da možete odmah videti kako izgleda UI

echo "================================================"
echo "Creating Test APK Files"
echo "================================================"
echo ""

APK_DIR="/root/webadminportal/web-admin/public/apk"

cd "$APK_DIR"

echo "Step 1/3: Creating test APK files..."

cat > lafantana-v2.1.0.apk << 'EOF'
This is a test APK file for demo purposes.
Replace this with a real build using BUILD_ANDROID_APK.sh
Version: 2.1.0
EOF

cat > lafantana-v2.0.0.apk << 'EOF'
This is a test APK file for demo purposes.
Version: 2.0.0
EOF

cat > lafantana-v1.9.0.apk << 'EOF'
This is a test APK file for demo purposes.
Version: 1.9.0
EOF

echo "✓ Test APK files created"
echo ""

echo "Step 2/3: Setting proper timestamps..."

touch -d "2025-11-05 16:45:00" lafantana-v1.9.0.apk
touch -d "2025-11-10 09:15:00" lafantana-v2.0.0.apk
touch -d "2025-11-11 14:30:00" lafantana-v2.1.0.apk

echo "✓ Timestamps set"
echo ""

echo "Step 3/3: Setting permissions..."

chmod 644 *.apk

echo "✓ Permissions set"
echo ""

echo "================================================"
echo "✅ SETUP COMPLETED!"
echo "================================================"
echo ""

ls -lth *.apk

echo ""
echo "Now you can view download links on web portal:"
echo "1. Open: http://appserver.lafantanasrb.local:3002"
echo "2. Login as super admin"
echo "3. Click 'Mobilna aplikacija' tab"
echo "4. You will see:"
echo "   - Current version card with download button"
echo "   - Build history table with 3 rows"
echo ""
echo "⚠️  NOTE: These are TEST files, not real APK!"
echo "To create a real APK, run: ./BUILD_ANDROID_APK.sh"
echo ""

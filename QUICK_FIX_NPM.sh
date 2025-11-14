#!/bin/bash

# Quick Fix Script - Koristi npm umesto bun
# Koristite ovaj script ako bun nije instaliran

set -e

echo "================================================"
echo "La Fantana WHS - Quick Fix (NPM verzija)"
echo "================================================"
echo ""

# Detect the correct directory
if [ -f "package.json" ]; then
    WEB_ADMIN_DIR="$(pwd)"
elif [ -d "web-admin" ]; then
    WEB_ADMIN_DIR="$(pwd)/web-admin"
elif [ -d "../web-admin" ]; then
    WEB_ADMIN_DIR="$(cd ../web-admin && pwd)"
elif [ -d "~/webadminportal/web-admin" ]; then
    WEB_ADMIN_DIR="$HOME/webadminportal/web-admin"
else
    echo "Error: Cannot find web-admin directory"
    exit 1
fi

echo "Working directory: $WEB_ADMIN_DIR"
cd "$WEB_ADMIN_DIR"
echo ""

echo "Step 1/5: Stopping PM2 processes..."
pm2 stop lafantana-whs-admin 2>/dev/null || echo "  (no PM2 process to stop)"
pm2 stop water-service-web-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
pm2 delete water-service-web-admin 2>/dev/null || true
echo "✓ PM2 processes stopped"
echo ""

echo "Step 2/5: Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -f bun.lock  # Remove bun lock file
echo "✓ Cache cleaned"
echo ""

echo "Step 3/5: Installing dependencies with NPM..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed!"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

echo "Step 4/5: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed!"
    exit 1
fi
echo "✓ Build completed"
echo ""

echo "Step 5/5: Starting server..."
if command -v pm2 &> /dev/null; then
    pm2 start "npm run start" --name lafantana-whs-admin
    pm2 save
    echo "✓ PM2 started"
else
    npm run start &
    echo "✓ Server started in background"
fi
echo ""

sleep 3

echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"

if command -v pm2 &> /dev/null; then
    pm2 status
fi

echo ""
echo "Testing server..."
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Server is responding on http://localhost:3002"
else
    echo "⚠️  Server may still be starting..."
fi

echo ""
echo "View logs: pm2 logs lafantana-whs-admin"
echo ""

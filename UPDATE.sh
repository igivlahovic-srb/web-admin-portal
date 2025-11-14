#!/bin/bash

# Universal Update Script - Auto-detects bun/npm
# Works on any Ubuntu server

set -e

echo "================================================"
echo "La Fantana WHS - Universal Update Script"
echo "================================================"
echo ""

# Step 1: Detect directory
echo "Detecting web-admin directory..."
if [ -f "package.json" ]; then
    WEB_ADMIN_DIR="$(pwd)"
elif [ -d "web-admin" ]; then
    WEB_ADMIN_DIR="$(pwd)/web-admin"
elif [ -d "$HOME/webadminportal/web-admin" ]; then
    WEB_ADMIN_DIR="$HOME/webadminportal/web-admin"
else
    echo "❌ Cannot find web-admin directory!"
    echo ""
    echo "Please run this script from:"
    echo "  - ~/webadminportal/web-admin, or"
    echo "  - ~/webadminportal, or"
    echo "  - any parent directory containing web-admin/"
    exit 1
fi

cd "$WEB_ADMIN_DIR"
echo "✓ Found: $WEB_ADMIN_DIR"
echo ""

# Step 2: Detect package manager
echo "Detecting package manager..."
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    INSTALL_CMD="bun install"
    BUILD_CMD="bun run build"
    START_CMD="bun run start"
    echo "✓ Using: bun ($(bun --version))"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
    BUILD_CMD="npm run build"
    START_CMD="npm run start"
    echo "✓ Using: npm ($(npm --version))"
else
    echo "❌ Neither bun nor npm found!"
    echo ""
    echo "Please install Node.js + npm:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi
echo ""

# Step 3: Stop existing processes
echo "Stopping existing processes..."
pm2 stop lafantana-whs-admin 2>/dev/null || echo "  (no PM2 process running)"
pm2 stop water-service-web-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
pm2 delete water-service-web-admin 2>/dev/null || true

# Kill port 3002
if command -v fuser &> /dev/null; then
    fuser -k 3002/tcp 2>/dev/null || true
else
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
fi

sleep 2
echo "✓ Processes stopped"
echo ""

# Step 4: Clean cache
echo "Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache

# Remove the other package manager's lock file
if [ "$PKG_MANAGER" = "bun" ]; then
    rm -f package-lock.json
else
    rm -f bun.lock
fi

echo "✓ Cache cleaned"
echo ""

# Step 5: Install dependencies
echo "Installing dependencies with $PKG_MANAGER..."
$INSTALL_CMD

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check internet connection"
    echo "  2. Check disk space: df -h"
    echo "  3. Try clearing cache: rm -rf node_modules && $INSTALL_CMD"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

# Step 6: Build
echo "Building application..."
$BUILD_CMD

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Common causes:"
    echo "  1. TypeScript errors - check code"
    echo "  2. Out of memory - try: export NODE_OPTIONS=--max_old_space_size=4096"
    echo "  3. Missing .env.local file"
    exit 1
fi
echo "✓ Build completed"
echo ""

# Step 7: Start with PM2
echo "Starting server..."

if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found, installing..."
    npm install -g pm2
fi

pm2 start "$START_CMD" --name lafantana-whs-admin
pm2 save
echo "✓ Server started"
echo ""

# Wait for server to start
sleep 3

echo "================================================"
echo "✅ Update Complete!"
echo "================================================"
echo ""

pm2 status

echo ""
echo "Testing server..."
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Server is responding on http://localhost:3002"
else
    echo "⚠️  Server may still be starting (wait 10 seconds and check again)"
fi

echo ""
echo "================================================"
echo "Useful commands:"
echo "================================================"
echo "  View logs:    pm2 logs lafantana-whs-admin"
echo "  Restart:      pm2 restart lafantana-whs-admin"
echo "  Stop:         pm2 stop lafantana-whs-admin"
echo "  Status:       pm2 status"
echo ""

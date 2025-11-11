#!/bin/bash

# Complete rebuild script - Works in any environment
# Automatically detects correct path

set -e

echo "================================================"
echo "La Fantana WHS - Complete Rebuild"
echo "================================================"
echo ""

# Detect the correct directory
if [ -f "package.json" ]; then
    WEB_ADMIN_DIR="$(pwd)"
elif [ -d "web-admin" ]; then
    WEB_ADMIN_DIR="$(pwd)/web-admin"
elif [ -d "../web-admin" ]; then
    WEB_ADMIN_DIR="$(cd ../web-admin && pwd)"
else
    echo "Error: Cannot find web-admin directory with package.json"
    exit 1
fi

echo "Working directory: $WEB_ADMIN_DIR"
cd "$WEB_ADMIN_DIR"
echo ""

echo "Step 1/6: Stopping PM2 processes..."
pm2 stop lafantana-whs-admin 2>/dev/null || echo "  (no PM2 process to stop)"
pm2 stop water-service-web-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
pm2 delete water-service-web-admin 2>/dev/null || true
echo "✓ PM2 processes stopped"
echo ""

echo "Step 2/6: Killing processes on port 3002..."
if command -v fuser &> /dev/null; then
    fuser -k 3002/tcp 2>/dev/null || echo "  (port already free)"
else
    lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "  (port already free)"
fi
sleep 2
echo "✓ Port 3002 cleared"
echo ""

echo "Step 3/6: Cleaning old build files..."
rm -rf .next
rm -rf node_modules/.cache
echo "✓ Cleaned cache"
echo ""

echo "Step 4/6: Installing dependencies..."
if command -v bun &> /dev/null; then
    echo "Using bun..."
    bun install
else
    echo "Bun not found, using npm..."
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if you have internet connection"
    echo "2. Try manually: cd $WEB_ADMIN_DIR && bun install"
    echo "3. Check if bun is installed: bun --version"
    echo "4. Try clearing lock file: rm bun.lock && bun install"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

echo "Step 5/6: Building application..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi

if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed!"
    echo ""
    echo "Common causes:"
    echo "1. TypeScript errors in code"
    echo "2. Missing environment variables"
    echo "3. Out of memory (try: export NODE_OPTIONS=--max_old_space_size=4096)"
    exit 1
fi
echo "✓ Build completed"
echo ""

echo "Step 6/6: Starting server with PM2..."
if command -v pm2 &> /dev/null; then
    # Verify port is free
    if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "Port 3002 still in use, waiting..."
        sleep 3
        fuser -k 3002/tcp 2>/dev/null || true
    fi

    if command -v bun &> /dev/null; then
        pm2 start "bun run start" --name lafantana-whs-admin
    else
        pm2 start "npm run start" --name lafantana-whs-admin
    fi
    pm2 save
    echo "✓ PM2 started"
else
    echo "PM2 not found, starting in background..."
    if command -v bun &> /dev/null; then
        bun run start &
    else
        npm run start &
    fi
    echo "✓ Server started in background"
fi
echo ""

# Wait and check
sleep 3

echo "================================================"
echo "Deployment Status"
echo "================================================"

if command -v pm2 &> /dev/null; then
    pm2 status
fi

echo ""
echo "Testing server..."
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Server is responding on http://localhost:3002"
else
    echo "⚠️  Server not responding yet (may still be starting)"
fi

echo ""
echo "================================================"
echo "Next steps:"
echo "================================================"
echo "• View logs: pm2 logs lafantana-whs-admin"
echo "• Restart: pm2 restart lafantana-whs-admin"
echo "• Stop: pm2 stop lafantana-whs-admin"
echo "• Access: http://localhost:3002"
echo ""

#!/bin/bash

# Complete rebuild script for Ubuntu server
# Run this when JavaScript files are not loading

set -e

echo "================================================"
echo "La Fantana WHS - Complete Rebuild"
echo "================================================"
echo ""

cd ~/webadminportal/web-admin

echo "Step 1/6: Stopping all processes on port 3002..."
pm2 stop lafantana-whs-admin 2>/dev/null || true
pm2 stop water-service-web-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
pm2 delete water-service-web-admin 2>/dev/null || true

# Kill any process using port 3002
echo "Killing any process on port 3002..."
fuser -k 3002/tcp 2>/dev/null || true
sleep 2
echo "✓ Port 3002 cleared"
echo ""

echo "Step 2/6: Cleaning old build files..."
rm -rf .next
rm -rf node_modules
rm -rf bun.lock
echo "✓ Cleaned"
echo ""

echo "Step 3/6: Installing dependencies..."
bun install
if [ $? -ne 0 ]; then
    echo "Error installing dependencies!"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

echo "Step 4/6: Building application..."
bun run build
if [ $? -ne 0 ]; then
    echo "Error building application!"
    exit 1
fi
echo "✓ Build completed"
echo ""

echo "Step 5/6: Verifying port is free..."
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port 3002 is still in use, killing again..."
    fuser -k 3002/tcp 2>/dev/null || true
    sleep 2
fi
echo "✓ Port is free"
echo ""

echo "Step 6/6: Starting PM2..."
pm2 start "bun run start" --name lafantana-whs-admin
pm2 save
echo "✓ PM2 started"
echo ""

# Wait and check
sleep 3

echo "================================================"
echo "Checking status..."
echo "================================================"
pm2 status

echo ""
echo "Testing server..."
curl -s http://localhost:3002 > /dev/null && echo "✓ Server is responding!" || echo "✗ Server is not responding"

echo ""
echo "View logs with: pm2 logs lafantana-whs-admin"
echo ""

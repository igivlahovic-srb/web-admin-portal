#!/bin/bash
# Fix Tailwind CSS Missing Error
# Instalira sve dependencies uključujući devDependencies

echo "================================================"
echo "Fixing Tailwind CSS Missing Error"
echo "================================================"
echo ""

cd /root/webadminportal/web-admin

echo "Step 1/4: Removing node_modules..."
rm -rf node_modules
echo "✓ node_modules removed"
echo ""

echo "Step 2/4: Removing .next build cache..."
rm -rf .next
echo "✓ .next cache removed"
echo ""

echo "Step 3/4: Installing ALL dependencies (including devDependencies)..."
npm install --include=dev
echo "✓ Dependencies installed"
echo ""

echo "Step 4/4: Building application..."
npm run build
echo "✓ Build completed"
echo ""

echo "================================================"
echo "✅ FIX COMPLETED!"
echo "================================================"
echo ""
echo "Tailwind CSS and all dependencies are now installed."
echo "You can now restart PM2:"
echo "  pm2 restart lafantana-whs-admin"
echo ""

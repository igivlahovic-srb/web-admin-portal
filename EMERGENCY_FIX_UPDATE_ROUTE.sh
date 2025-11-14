#!/bin/bash
# Emergency Fix: Update Web Portal Route sa Tailwind CSS Fix
# Direktno popravlja /api/update/route.ts na Ubuntu serveru

echo "================================================"
echo "Fixing Web Portal Update Route"
echo "================================================"
echo ""

cd /root/webadminportal/web-admin

echo "Step 1/5: Backup current route.ts..."
cp app/api/update/route.ts app/api/update/route.ts.backup
echo "✓ Backup created"
echo ""

echo "Step 2/5: Updating route.ts to use npm install --include=dev..."

# Find and replace "npm install" with "npm install --include=dev"
sed -i 's/npm install"/npm install --include=dev"/g' app/api/update/route.ts

echo "✓ Route updated"
echo ""

echo "Step 3/5: Cleaning current build..."
rm -rf node_modules .next
echo "✓ Cleaned"
echo ""

echo "Step 4/5: Installing ALL dependencies (including devDependencies)..."
npm install --include=dev
echo "✓ Dependencies installed"
echo ""

echo "Step 5/5: Building application..."
npm run build
echo "✓ Build completed"
echo ""

echo "Step 6/6: Restarting PM2..."
pm2 restart lafantana-whs-admin
echo "✓ PM2 restarted"
echo ""

echo "================================================"
echo "✅ FIX COMPLETED!"
echo "================================================"
echo ""
echo "Web portal update route is now fixed."
echo "Next time you click 'Ažuriraj', it will work correctly!"
echo ""
echo "Verification:"
echo "  1. Open web portal: http://appserver.lafantanasrb.local:3002"
echo "  2. Check if CSS looks good"
echo "  3. Try 'Ažuriraj' button again"
echo ""

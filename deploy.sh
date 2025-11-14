#!/bin/bash

# Deploy script for Web Admin Panel
# Run this script after pulling latest changes from GitHub

set -e  # Exit on any error

echo "========================================="
echo "La Fantana WHS - Web Admin Deployment"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Make sure you're in the web-admin directory"
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)
echo "Working directory: $CURRENT_DIR"
echo ""

# Step 1: Pull latest changes
echo "Step 1/5: Pulling latest changes from GitHub..."
git pull origin main
echo "✓ Git pull completed"
echo ""

# Step 2: Install dependencies
echo "Step 2/5: Installing dependencies with bun..."
bun install
echo "✓ Dependencies installed"
echo ""

# Step 3: Build the application
echo "Step 3/5: Building Next.js application..."
bun run build
echo "✓ Build completed"
echo ""

# Step 4: Check if PM2 is installed
echo "Step 4/5: Checking process manager..."
if command -v pm2 &> /dev/null; then
    echo "PM2 detected"

    # Check if app is running
    if pm2 describe water-service-web-admin &> /dev/null; then
        echo "Restarting existing PM2 process..."
        pm2 restart water-service-web-admin
        pm2 save
    else
        echo "Starting new PM2 process..."
        pm2 start npm --name "water-service-web-admin" -- run start
        pm2 save
    fi
    echo "✓ PM2 process updated"
else
    echo "PM2 not found. Checking systemd..."
    if systemctl is-active --quiet web-admin; then
        echo "Restarting systemd service..."
        sudo systemctl restart web-admin
        echo "✓ Systemd service restarted"
    else
        echo "Warning: No process manager found"
        echo "Please start the application manually with: bun run start"
    fi
fi
echo ""

# Step 5: Verify deployment
echo "Step 5/5: Verifying deployment..."
sleep 3

if command -v pm2 &> /dev/null; then
    pm2 list | grep water-service-web-admin
fi

echo ""
echo "========================================="
echo "✓ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Web Admin should now be running on:"
echo "  - http://localhost:3002"
echo "  - http://$(hostname -I | awk '{print $1}'):3002"
echo ""
echo "To view logs:"
echo "  pm2 logs water-service-web-admin"
echo ""

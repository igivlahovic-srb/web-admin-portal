#!/bin/bash

# Clean rebuild script for La Fantana Web Admin
# This script completely cleans and rebuilds the web admin application

echo "🧹 Starting clean rebuild..."

# Navigate to web-admin directory
cd "$(dirname "$0")/web-admin" || exit 1

# Remove build artifacts
echo "🗑️  Removing old build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# Clear bun cache
echo "🧹 Clearing bun cache..."
bun pm cache rm

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
bun install

# Build application
echo "🔨 Building application..."
bun run build

echo "✅ Clean rebuild complete!"
echo ""
echo "Now restart the service:"
echo "  sudo systemctl restart lafantana-admin"
echo ""
echo "Or if using PM2:"
echo "  pm2 restart lafantana-whs-admin"

#!/bin/bash

# ============================================
# Web Admin Panel - Ubuntu Deployment Script
# ============================================

set -e  # Exit on error

echo "================================================"
echo "Web Admin Panel - CSS Fix & Deployment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found!${NC}"
    echo "Make sure you're in the web-admin directory"
    exit 1
fi

echo -e "${BLUE}Step 1/6: Cleaning old build files...${NC}"
rm -rf .next node_modules bun.lock 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

echo -e "${BLUE}Step 2/6: Installing dependencies...${NC}"
bun install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 3/6: Building application...${NC}"
bun run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 4/6: Stopping old server...${NC}"
# Try to stop PM2 process
if command -v pm2 &> /dev/null; then
    pm2 delete water-service-web-admin 2>/dev/null || true
    echo -e "${GREEN}✓ PM2 process stopped${NC}"
else
    # Try to kill process on port 3002
    fuser -k 3002/tcp 2>/dev/null || true
    echo -e "${GREEN}✓ Process on port 3002 stopped${NC}"
fi
echo ""

echo -e "${BLUE}Step 5/6: Starting server...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 start "bun run start" --name water-service-web-admin
    pm2 save
    echo -e "${GREEN}✓ Server started with PM2${NC}"
else
    echo -e "${RED}PM2 not found. Starting in background...${NC}"
    nohup bun run start > /tmp/web-admin.log 2>&1 &
    echo -e "${GREEN}✓ Server started (logs: /tmp/web-admin.log)${NC}"
fi
echo ""

echo -e "${BLUE}Step 6/6: Verifying deployment...${NC}"
sleep 3

# Check if server is running
if curl -s http://localhost:3002 > /dev/null; then
    echo -e "${GREEN}✓ Server is responding!${NC}"
else
    echo -e "${RED}✗ Server is not responding${NC}"
    exit 1
fi
echo ""

echo "================================================"
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo "================================================"
echo ""
echo "Web Admin is now running on:"
echo "  - http://localhost:3002"
if command -v hostname &> /dev/null; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "  - http://${SERVER_IP}:3002"
fi
echo ""
echo "Next steps:"
echo "1. Open browser and go to the URL above"
echo "2. Clear browser cache (Ctrl+Shift+Del)"
echo "3. Hard refresh (Ctrl+Shift+R)"
echo "4. Login with: admin / admin123"
echo ""

if command -v pm2 &> /dev/null; then
    echo "To view logs: pm2 logs water-service-web-admin"
    echo "To restart:   pm2 restart water-service-web-admin"
else
    echo "To view logs: tail -f /tmp/web-admin.log"
fi
echo ""

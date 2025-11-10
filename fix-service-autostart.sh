#!/bin/bash

# ============================================
# Fix LaFantana Admin Service Auto-Start
# ============================================

set -e  # Exit on error

echo "================================================"
echo "LaFantana Admin - Service Auto-Start Fix"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICE_NAME="lafantana-admin"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PORT=3003

echo -e "${BLUE}Step 1/7: Checking if service exists...${NC}"
if [ ! -f "$SERVICE_FILE" ]; then
    echo -e "${RED}✗ Service file not found: $SERVICE_FILE${NC}"
    echo "Please create the service file first!"
    exit 1
fi
echo -e "${GREEN}✓ Service file exists${NC}"
echo ""

echo -e "${BLUE}Step 2/7: Checking current service status...${NC}"
sudo systemctl status $SERVICE_NAME --no-pager || true
echo ""

echo -e "${BLUE}Step 3/7: Checking PORT configuration...${NC}"
CURRENT_PORT=$(grep "Environment=PORT=" $SERVICE_FILE | grep -oP 'PORT=\K[0-9]+' || echo "not set")
echo "Current PORT in service file: $CURRENT_PORT"

if [ "$CURRENT_PORT" != "$PORT" ]; then
    echo -e "${YELLOW}⚠ PORT needs to be updated to $PORT${NC}"
    echo "Current service file content:"
    cat $SERVICE_FILE
    echo ""
    echo -e "${YELLOW}Do you want to update PORT to $PORT? (yes/no)${NC}"
    read -p "> " UPDATE_PORT

    if [ "$UPDATE_PORT" = "yes" ]; then
        echo "Updating PORT in service file..."
        sudo sed -i "s/Environment=PORT=.*/Environment=PORT=$PORT/" $SERVICE_FILE
        echo -e "${GREEN}✓ PORT updated to $PORT${NC}"
    fi
else
    echo -e "${GREEN}✓ PORT is correctly set to $PORT${NC}"
fi
echo ""

echo -e "${BLUE}Step 4/7: Stopping any existing processes on port $PORT...${NC}"
sudo fuser -k $PORT/tcp 2>/dev/null || true
echo -e "${GREEN}✓ Port $PORT cleared${NC}"
echo ""

echo -e "${BLUE}Step 5/7: Reloading systemd daemon...${NC}"
sudo systemctl daemon-reload
echo -e "${GREEN}✓ Daemon reloaded${NC}"
echo ""

echo -e "${BLUE}Step 6/7: Enabling auto-start on boot...${NC}"
sudo systemctl enable $SERVICE_NAME
echo -e "${GREEN}✓ Auto-start enabled${NC}"
echo ""

echo -e "${BLUE}Step 7/7: Starting service...${NC}"
sudo systemctl restart $SERVICE_NAME
sleep 3
echo -e "${GREEN}✓ Service restarted${NC}"
echo ""

# Verify service is running
echo "================================================"
echo -e "${BLUE}Verification:${NC}"
echo "================================================"
echo ""

echo -e "${BLUE}Service Status:${NC}"
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✓ Service is running${NC}"
else
    echo -e "${RED}✗ Service is NOT running${NC}"
    echo ""
    echo "Recent logs:"
    sudo journalctl -u $SERVICE_NAME -n 20 --no-pager
    exit 1
fi
echo ""

echo -e "${BLUE}Auto-Start Status:${NC}"
if sudo systemctl is-enabled --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✓ Auto-start is enabled (will start on boot)${NC}"
else
    echo -e "${RED}✗ Auto-start is NOT enabled${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Port Check:${NC}"
if sudo ss -tlnp | grep ":$PORT " > /dev/null; then
    echo -e "${GREEN}✓ Service is listening on port $PORT${NC}"
    sudo ss -tlnp | grep ":$PORT "
else
    echo -e "${RED}✗ Service is NOT listening on port $PORT${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}HTTP Test:${NC}"
if curl -s http://localhost:$PORT > /dev/null; then
    echo -e "${GREEN}✓ Service is responding to HTTP requests${NC}"
else
    echo -e "${RED}✗ Service is NOT responding to HTTP requests${NC}"
    echo "Check the logs for errors"
fi
echo ""

echo "================================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Service is now configured to:"
echo "  - Start automatically on boot"
echo "  - Run on port $PORT"
echo "  - Restart automatically if it crashes"
echo ""
echo "Access the admin panel at:"
echo "  - http://localhost:$PORT"
if command -v hostname &> /dev/null; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "  - http://${SERVER_IP}:$PORT"
fi
echo ""
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME   - Check status"
echo "  sudo systemctl restart $SERVICE_NAME  - Restart service"
echo "  sudo systemctl stop $SERVICE_NAME     - Stop service"
echo "  sudo journalctl -u $SERVICE_NAME -f   - Follow logs"
echo "  sudo journalctl -u $SERVICE_NAME -n 50 - Last 50 log lines"
echo ""
echo "To test auto-start after reboot:"
echo "  sudo reboot"
echo "  (wait for system to boot)"
echo "  sudo systemctl status $SERVICE_NAME"
echo ""

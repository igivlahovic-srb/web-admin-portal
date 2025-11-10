#!/bin/bash

# Full Re-deployment Script for Ubuntu Server
# This script will completely remove and re-install everything from GitHub

set -e  # Exit on any error

echo "================================================"
echo "La Fantana WHS - Kompletna Reinstalacija"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://019a6624-8c70-7588-b2d9-2c35197b6d10:notrequired@git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git"
PROJECT_DIR="$HOME/webadminportal"
BACKUP_DIR="$HOME/webadminportal_backup_$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}UPOZORENJE: Ova skripta će obrisati postojeći projekat i povući ga iznova!${NC}"
echo ""
read -p "Da li želite da nastavite? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Otkazano."
    exit 0
fi

echo ""
echo -e "${GREEN}Korak 1/9: Zaustavljanje postojećih servisa...${NC}"
# Stop PM2 if exists
pm2 stop water-service-web-admin 2>/dev/null || true
pm2 stop lafantana-whs-admin 2>/dev/null || true
pm2 delete water-service-web-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
# Stop systemd service if exists
sudo systemctl stop lafantana-admin 2>/dev/null || true
sudo systemctl disable lafantana-admin 2>/dev/null || true
echo "✓ Postojeći servisi zaustavljeni"
echo ""

echo -e "${GREEN}Korak 2/9: Backup postojećeg projekta...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo "Pravljenje backup-a u: $BACKUP_DIR"
    mv "$PROJECT_DIR" "$BACKUP_DIR"
    echo "✓ Backup napravljen"
else
    echo "Projekat ne postoji, preskačem backup"
fi
echo ""

echo -e "${GREEN}Korak 3/9: Kloniranje projekta sa Vibecode Git-a...${NC}"
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo "✓ Projekat kloniran"
echo ""

echo -e "${GREEN}Korak 4/9: Instalacija root zavisnosti...${NC}"
bun install
echo "✓ Root zavisnosti instalirane"
echo ""

echo -e "${GREEN}Korak 5/9: Instalacija web-admin zavisnosti...${NC}"
cd web-admin
bun install
echo "✓ Web-admin zavisnosti instalirane"
echo ""

echo -e "${GREEN}Korak 6/9: Build web-admin aplikacije...${NC}"
bun run build
if [ $? -eq 0 ]; then
    echo "✓ Build uspešan"
else
    echo -e "${RED}✗ Build neuspešan!${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}Korak 7/9: Kreiranje systemd servisa...${NC}"
SERVICE_NAME="lafantana-admin"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Create systemd service file
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=La Fantana WHS Web Admin Panel
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/web-admin
ExecStart=$(which bun) run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lafantana-admin

Environment=NODE_ENV=production
Environment=PORT=3003

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Systemd servis kreiran"
echo ""

echo -e "${GREEN}Korak 8/9: Omogućavanje auto-start...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
echo "✓ Auto-start omogućen"
echo ""

echo -e "${GREEN}Korak 9/9: Pokretanje servisa...${NC}"
sudo systemctl restart $SERVICE_NAME
echo "✓ Servis pokrenut"
echo ""

# Wait for server to start
echo "Čekanje da se server pokrene..."
sleep 5

# Check if server is running
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo ""
    echo "================================================"
    echo -e "${GREEN}✓ Instalacija uspešno završena!${NC}"
    echo "================================================"
    echo ""
    echo "Web Admin je dostupan na:"
    echo "  - http://localhost:3003"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "  - http://${SERVER_IP}:3003"
    echo ""
    echo "Systemd komande:"
    echo "  sudo systemctl status $SERVICE_NAME   - Proveri status"
    echo "  sudo systemctl restart $SERVICE_NAME  - Restartuj"
    echo "  sudo systemctl stop $SERVICE_NAME     - Zaustavi"
    echo "  sudo journalctl -u $SERVICE_NAME -f   - Prati logove"
    echo ""
    echo "Servis će se automatski pokrenuti nakon restarta servera!"
    echo ""
    echo "Backup lokacija: $BACKUP_DIR"
    echo "(Možete obrisati nakon što proverite da sve radi)"
    echo ""
    sudo systemctl status $SERVICE_NAME --no-pager
else
    echo -e "${RED}✗ Greška: Servis nije pokrenut${NC}"
    echo "Proverite logove: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

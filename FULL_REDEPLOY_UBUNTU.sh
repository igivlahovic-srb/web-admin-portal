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
REPO_URL="https://git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git"
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
echo -e "${GREEN}Korak 1/7: Zaustavljanje PM2 procesa...${NC}"
pm2 stop water-service-web-admin 2>/dev/null || true
pm2 stop lafantana-whs-admin 2>/dev/null || true
pm2 delete water-service-web-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
echo "✓ PM2 procesi zaustavljeni"
echo ""

echo -e "${GREEN}Korak 2/7: Backup postojećeg projekta...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo "Pravljenje backup-a u: $BACKUP_DIR"
    mv "$PROJECT_DIR" "$BACKUP_DIR"
    echo "✓ Backup napravljen"
else
    echo "Projekat ne postoji, preskačem backup"
fi
echo ""

echo -e "${GREEN}Korak 3/7: Kloniranje projekta sa GitHub-a...${NC}"
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo "✓ Projekat kloniran"
echo ""

echo -e "${GREEN}Korak 4/7: Instalacija root zavisnosti...${NC}"
bun install
echo "✓ Root zavisnosti instalirane"
echo ""

echo -e "${GREEN}Korak 5/7: Instalacija web-admin zavisnosti...${NC}"
cd web-admin
bun install
echo "✓ Web-admin zavisnosti instalirane"
echo ""

echo -e "${GREEN}Korak 6/7: Build web-admin aplikacije...${NC}"
bun run build
if [ $? -eq 0 ]; then
    echo "✓ Build uspešan"
else
    echo -e "${RED}✗ Build neuspešan!${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}Korak 7/7: Pokretanje PM2 procesa...${NC}"
pm2 start "bun run start" --name lafantana-whs-admin
pm2 save
echo "✓ PM2 proces pokrenut"
echo ""

# Wait for server to start
echo "Čekanje da se server pokrene..."
sleep 5

# Check if server is running
if pm2 describe lafantana-whs-admin > /dev/null 2>&1; then
    echo ""
    echo "================================================"
    echo -e "${GREEN}✓ Instalacija uspešno završena!${NC}"
    echo "================================================"
    echo ""
    echo "Web Admin je dostupan na:"
    echo "  - http://localhost:3002"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "  - http://${SERVER_IP}:3002"
    echo ""
    echo "PM2 komande:"
    echo "  pm2 logs lafantana-whs-admin  - Prikazi logove"
    echo "  pm2 restart lafantana-whs-admin  - Restartuj"
    echo "  pm2 stop lafantana-whs-admin  - Zaustavi"
    echo ""
    echo "Backup lokacija: $BACKUP_DIR"
    echo "(Možete obrisati nakon što proverite da sve radi)"
    echo ""
    pm2 status
else
    echo -e "${RED}✗ Greška: PM2 proces nije pokrenut${NC}"
    echo "Proverite logove: pm2 logs"
    exit 1
fi

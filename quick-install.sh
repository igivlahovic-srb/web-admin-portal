#!/bin/bash

###############################################################################
# La Fantana WHS - Quick Web Admin Panel Installer
# Ultra-brzainstalacija bez potrebe za git clone
###############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Web Admin Panel - Quick Install${NC}"
echo -e "${BLUE}=================================${NC}\n"

echo -e "${GREEN}[1/7] Ažuriranje sistema...${NC}"
apt update -y && apt upgrade -y

echo -e "${GREEN}[2/7] Instalacija Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node.js: $(node --version)"

echo -e "${GREEN}[3/7] Instalacija Bun...${NC}"
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi
source ~/.bashrc
echo "Bun: v$(bun --version)"

echo -e "${GREEN}[4/7] Kreiranje projekta...${NC}"
cd ~
git clone https://github.com/igivlahovic-srb/webadminportal.git 2>/dev/null || {
    echo "Git clone failed, creating manually..."
    mkdir -p ~/webadminportal/web-admin
}

cd ~/webadminportal/web-admin

# Kreiraj package.json ako ne postoji
if [ ! -f "package.json" ]; then
    cat > package.json << 'PKGEOF'
{
  "name": "water-service-web-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3002"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
PKGEOF
fi

echo -e "${GREEN}[5/7] Instalacija npm paketa...${NC}"
bun install

echo -e "${GREEN}[6/7] Build produkcijske verzije...${NC}"
bun run build

echo -e "${GREEN}[7/7] Firewall konfiguracija...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 3002/tcp
    ufw allow 22/tcp
    echo "Firewall konfigurisan!"
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}✓ INSTALACIJA KOMPLETNA!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "Pokreni aplikaciju:"
echo "  cd ~/webadminportal/web-admin"
echo "  bun run start"
echo ""
echo "Pristup:"
echo "  http://$(hostname -I | awk '{print $1}'):3002"
echo "  Username: admin"
echo "  Password: admin123"
echo ""

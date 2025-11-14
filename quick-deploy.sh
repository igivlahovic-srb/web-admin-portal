#!/bin/bash

# 🚀 Quick Deploy Script za LaFantana WHS Admin Portal
# Ovaj skripta automatski deploy-uje portal na production server

set -e  # Exit on any error

echo "🔧 LaFantana WHS Admin - Quick Deploy Script"
echo "=============================================="
echo ""

# Boje za output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funkcija za proveru da li smo na serveru
check_server() {
    if [ ! -d "/root/.pm2" ]; then
        echo -e "${YELLOW}⚠️  PM2 folder ne postoji. Da li ste na pravom serveru?${NC}"
        read -p "Nastaviti? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Funkcija za zaustavljanje starog procesa
stop_old_process() {
    echo -e "${YELLOW}🛑 Zaustavljam stari PM2 proces...${NC}"

    if pm2 list | grep -q "lafantana-whs-admin"; then
        pm2 stop lafantana-whs-admin || true
        pm2 delete lafantana-whs-admin || true
        echo -e "${GREEN}✅ Stari proces zaustavljen${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 proces ne postoji (možda je prvi put?)${NC}"
    fi

    # Proveri da li port 3002 je zauzet
    if lsof -i :3002 >/dev/null 2>&1; then
        echo -e "${RED}⚠️  Port 3002 je još uvek zauzet!${NC}"
        echo "Ubijam proces..."
        lsof -i :3002 | grep LISTEN | awk '{print $2}' | xargs kill -9 || true
        sleep 2
        echo -e "${GREEN}✅ Port oslobođen${NC}"
    fi
}

# Funkcija za backup
create_backup() {
    if [ -d "$HOME/lafantana-whs-admin" ]; then
        echo -e "${YELLOW}💾 Kreiram backup...${NC}"
        BACKUP_FILE="$HOME/lafantana-whs-admin-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_FILE" "$HOME/lafantana-whs-admin/" 2>/dev/null || true
        echo -e "${GREEN}✅ Backup kreiran: $BACKUP_FILE${NC}"
    fi
}

# Funkcija za install dependencies
install_deps() {
    echo -e "${YELLOW}📦 Instaliram dependencies...${NC}"
    cd "$HOME/lafantana-whs-admin"

    if command -v bun >/dev/null 2>&1; then
        echo "Koristim bun..."
        bun install
    else
        echo "Koristim npm..."
        npm install
    fi

    echo -e "${GREEN}✅ Dependencies instalirani${NC}"
}

# Funkcija za build
build_project() {
    echo -e "${YELLOW}🔨 Build-ujem projekat...${NC}"
    cd "$HOME/lafantana-whs-admin"

    if command -v bun >/dev/null 2>&1; then
        bun run build
    else
        npm run build
    fi

    echo -e "${GREEN}✅ Build završen${NC}"
}

# Funkcija za pokretanje PM2
start_pm2() {
    echo -e "${YELLOW}🚀 Pokrećem PM2 proces...${NC}"
    cd "$HOME/lafantana-whs-admin"

    pm2 start npm --name "lafantana-whs-admin" -- start
    pm2 save

    echo -e "${GREEN}✅ PM2 proces pokrenut${NC}"
    echo ""
    echo -e "${GREEN}🎉 Deployment završen!${NC}"
    echo ""
    echo "📊 Status:"
    pm2 status
    echo ""
    echo "🌐 Portal je dostupan na: http://localhost:3002"
    echo "📝 Proveri logove sa: pm2 logs lafantana-whs-admin"
}

# Funkcija za proveru health-a
check_health() {
    echo ""
    echo -e "${YELLOW}🏥 Proveravam health endpoint...${NC}"
    sleep 3  # Daj serveru malo vremena da starta

    if curl -s http://localhost:3002/api/health | grep -q "ok"; then
        echo -e "${GREEN}✅ Server radi!${NC}"
    else
        echo -e "${RED}❌ Server ne odgovara. Proverite logove:${NC}"
        echo "pm2 logs lafantana-whs-admin --lines 50"
    fi
}

# Main execution
main() {
    echo "Proveravam okruženje..."
    check_server

    echo ""
    read -p "🔄 Da li želite da kreirate backup pre deploy-a? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_backup
    fi

    echo ""
    stop_old_process

    echo ""
    if [ ! -d "$HOME/lafantana-whs-admin" ]; then
        echo -e "${RED}❌ Folder $HOME/lafantana-whs-admin ne postoji!${NC}"
        echo "Morate prvo kopirati projekat na server:"
        echo "  scp -r /home/user/lafantana-whs-admin root@lftaserver-appserver:~/"
        exit 1
    fi

    install_deps
    echo ""
    build_project
    echo ""
    start_pm2
    check_health

    echo ""
    echo -e "${GREEN}✅ Sve gotovo!${NC}"
    echo ""
    echo "📋 Sledeći koraci:"
    echo "  1. Otvorite browser: http://YOUR_IP:3002"
    echo "  2. Prijavite se kao admin/admin123"
    echo "  3. Konfigurirajte URL u mobilnoj aplikaciji"
    echo "  4. Testirajte sinhronizaciju"
    echo ""
    echo "🔧 Korisne komande:"
    echo "  pm2 logs lafantana-whs-admin       # Pogledaj logove"
    echo "  pm2 restart lafantana-whs-admin    # Restartuj"
    echo "  pm2 stop lafantana-whs-admin       # Zaustavi"
    echo "  pm2 monit                          # Monitoring"
}

# Pokreni main funkciju
main

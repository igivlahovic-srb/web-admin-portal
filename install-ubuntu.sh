#!/bin/bash

###############################################################################
# La Fantana WHS - Web Admin Panel Installer for Ubuntu 22.04
# Automatska instalacija web admin panela na fresh Ubuntu 22.04 server
###############################################################################

set -e  # Exit on error

# Boje za output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcije za printanje
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Provera da li smo root ili imamo sudo
if [ "$EUID" -ne 0 ]; then
    if ! command -v sudo &> /dev/null; then
        print_error "Ovaj script zahteva root ili sudo privilegije"
        exit 1
    fi
    SUDO="sudo"
else
    SUDO=""
fi

###############################################################################
# KORAK 1: Ažuriranje sistema
###############################################################################

print_header "KORAK 1: Ažuriranje sistema"
print_info "Ažuriram sistem pakete..."
$SUDO apt update -y
$SUDO apt upgrade -y
print_success "Sistem ažuriran!"

###############################################################################
# KORAK 2: Instalacija Node.js
###############################################################################

print_header "KORAK 2: Instalacija Node.js 20.x LTS"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js je već instaliran: $NODE_VERSION"
    read -p "Da li želiš da reinstaliraš Node.js? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Instaliram Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
        $SUDO apt install -y nodejs
    fi
else
    print_info "Instaliram Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
    $SUDO apt install -y nodejs
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js instaliran: $NODE_VERSION"
print_success "npm instaliran: $NPM_VERSION"

###############################################################################
# KORAK 3: Instalacija Bun
###############################################################################

print_header "KORAK 3: Instalacija Bun"

if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    print_warning "Bun je već instaliran: v$BUN_VERSION"
else
    print_info "Instaliram Bun..."
    curl -fsSL https://bun.sh/install | bash

    # Dodaj Bun u PATH za trenutnu sesiju
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    # Proveri da li je dodat u bashrc
    if ! grep -q 'BUN_INSTALL' ~/.bashrc; then
        echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
        print_success "Bun dodat u ~/.bashrc"
    fi

    BUN_VERSION=$(bun --version)
    print_success "Bun instaliran: v$BUN_VERSION"
fi

###############################################################################
# KORAK 4: Pronalaženje projekta
###############################################################################

print_header "KORAK 4: Lokacija projekta"

# Ako smo u web-admin folderu
if [ -f "package.json" ] && grep -q "water-service-web-admin" package.json; then
    PROJECT_DIR=$(pwd)
    print_success "Projekat pronađen u trenutnom direktorijumu"
else
    # Traži projekat
    print_info "Trenutni direktorijum nije web-admin folder"
    read -p "Unesi putanju do web-admin foldera: " PROJECT_DIR

    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Folder ne postoji: $PROJECT_DIR"
        exit 1
    fi

    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        print_error "Nije pronađen package.json u: $PROJECT_DIR"
        exit 1
    fi
fi

cd "$PROJECT_DIR"
print_success "Radim u direktorijumu: $PROJECT_DIR"

###############################################################################
# KORAK 5: Instalacija zavisnosti
###############################################################################

print_header "KORAK 5: Instalacija npm paketa"
print_info "Instaliram zavisnosti (ovo može potrajati)..."
bun install
print_success "Sve zavisnosti instalirane!"

###############################################################################
# KORAK 6: Build aplikacije
###############################################################################

print_header "KORAK 6: Build produkcijske verzije"
print_info "Pravim optimizovani build (ovo može potrajati)..."
bun run build
print_success "Build uspešno kreiran!"

###############################################################################
# KORAK 7: Firewall
###############################################################################

print_header "KORAK 7: Firewall konfiguracija"

if command -v ufw &> /dev/null; then
    print_info "Konfigurisanje UFW firewall-a..."
    $SUDO ufw allow 3002/tcp comment "Water Admin Panel"
    $SUDO ufw allow 22/tcp comment "SSH"

    # Proveri da li je UFW već aktivan
    if $SUDO ufw status | grep -q "Status: active"; then
        print_success "UFW firewall već aktivan"
    else
        print_warning "UFW firewall nije aktivan"
        read -p "Da li želiš da aktiviraš UFW firewall? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $SUDO ufw --force enable
            print_success "UFW firewall aktiviran"
        fi
    fi

    print_success "Port 3002 otvoren za web panel"
else
    print_warning "UFW nije instaliran - preskačem firewall konfiguraciju"
fi

###############################################################################
# KORAK 8: PM2 instalacija (opciono)
###############################################################################

print_header "KORAK 8: PM2 Process Manager (opciono)"
print_info "PM2 održava aplikaciju uvek pokrenutom i automatski restartuje na reboot-u"
read -p "Da li želiš da instaliraš PM2? (Y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    if command -v pm2 &> /dev/null; then
        print_warning "PM2 je već instaliran"
    else
        print_info "Instaliram PM2..."
        $SUDO npm install -g pm2
        print_success "PM2 instaliran!"
    fi

    # Zaustavi stari PM2 proces ako postoji
    pm2 delete water-admin 2>/dev/null || true

    print_info "Pokrećem aplikaciju sa PM2..."
    pm2 start "bun run start" --name water-admin
    pm2 save

    print_info "Konfigurisanje auto-start na boot-u..."
    print_warning "VAŽNO: Sledeća komanda će ispisati komandu koju MORAŠ pokrenuti!"
    pm2 startup

    print_success "PM2 konfigurisan!"
    print_info "Za status: pm2 status"
    print_info "Za logove: pm2 logs water-admin"
else
    print_info "PM2 instalacija preskočena"
fi

###############################################################################
# KORAK 9: Nginx (opciono)
###############################################################################

print_header "KORAK 9: Nginx Reverse Proxy (opciono)"
print_info "Nginx omogućava pristup aplikaciji na portu 80 umesto 3002"
read -p "Da li želiš da instaliraš i konfigurišeš Nginx? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Instaliraj Nginx
    if command -v nginx &> /dev/null; then
        print_warning "Nginx je već instaliran"
    else
        print_info "Instaliram Nginx..."
        $SUDO apt install -y nginx
        print_success "Nginx instaliran!"
    fi

    # Dobij server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')

    print_info "Kreiram Nginx konfiguraciju..."

    # Kreiraj Nginx config
    $SUDO tee /etc/nginx/sites-available/water-admin > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_IP _;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Aktiviraj config
    $SUDO ln -sf /etc/nginx/sites-available/water-admin /etc/nginx/sites-enabled/
    $SUDO rm -f /etc/nginx/sites-enabled/default

    # Test i restart
    $SUDO nginx -t
    $SUDO systemctl restart nginx
    $SUDO systemctl enable nginx

    # Otvori port 80
    if command -v ufw &> /dev/null; then
        $SUDO ufw allow 80/tcp comment "HTTP"
        $SUDO ufw allow 443/tcp comment "HTTPS"
    fi

    print_success "Nginx konfigurisan!"
    print_info "Aplikacija dostupna na: http://$SERVER_IP"
else
    print_info "Nginx instalacija preskočena"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    print_info "Aplikacija dostupna na: http://$SERVER_IP:3002"
fi

###############################################################################
# ZAVRŠETAK
###############################################################################

print_header "INSTALACIJA ZAVRŠENA! 🎉"

SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}La Fantana WHS - Web Admin Panel${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 Pristup aplikaciji:${NC}"

if command -v nginx &> /dev/null && $SUDO systemctl is-active --quiet nginx; then
    echo -e "   ${GREEN}http://$SERVER_IP${NC}"
    echo -e "   ${GREEN}http://$SERVER_IP:3002${NC} (direktno)"
else
    echo -e "   ${GREEN}http://$SERVER_IP:3002${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Login kredencijali:${NC}"
echo -e "   Username: ${YELLOW}admin${NC}"
echo -e "   Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${RED}⚠️  OBAVEZNO promeni default lozinku!${NC}"
echo ""

if command -v pm2 &> /dev/null && pm2 list | grep -q "water-admin"; then
    echo -e "${BLUE}📊 PM2 komande:${NC}"
    echo -e "   pm2 status              - Status aplikacije"
    echo -e "   pm2 logs water-admin    - Prikaži logove"
    echo -e "   pm2 restart water-admin - Restartuj aplikaciju"
    echo -e "   pm2 stop water-admin    - Zaustavi aplikaciju"
    echo ""
fi

echo -e "${BLUE}📱 Povezivanje mobilne aplikacije:${NC}"
echo -e "   1. Prijavi se kao admin (admin/admin123)"
echo -e "   2. Idi na Profil → Settings"
echo -e "   3. Unesi URL: ${YELLOW}http://$SERVER_IP:3002${NC}"
echo -e "   4. Klikni 'Sačuvaj' i 'Testiraj konekciju'"
echo -e "   5. Klikni 'Sinhronizuj sada'"
echo ""

echo -e "${BLUE}📚 Dokumentacija:${NC}"
echo -e "   ${PROJECT_DIR}/UBUNTU_INSTALL.md"
echo -e "   ${PROJECT_DIR}/README.md"
echo ""

print_success "Instalacija kompletna!"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

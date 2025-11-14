#!/bin/bash

################################################################################
# AUTOMATSKI DEPLOYMENT SCRIPT ZA WEB ADMIN PORTAL NA UBUNTU
#
# Ovaj script automatski instalira i konfigurise web admin portal
# na Ubuntu 22.04+ server sa svim potrebnim alatima
#
# Koriscenje:
#   sudo bash DEPLOY_WEB_PORTAL_UBUNTU.sh
#
# Autor: La Fantana WHS
# Verzija: 1.0
################################################################################

set -e  # Zaustavi script pri prvoj gresci

# Boje za output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcija za ispis poruka
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Provera da li je root
if [[ $EUID -ne 0 ]]; then
   print_error "Ovaj script mora biti pokrenut kao root (sudo)"
   exit 1
fi

print_header "LA FANTANA WHS - WEB PORTAL DEPLOYMENT"
echo "Pocetak automatske instalacije..."

# ============================================================================
# KORAK 1: UPDATE SISTEMA
# ============================================================================
print_header "KORAK 1/10: Azuriranje sistema"
apt update
apt upgrade -y
print_success "Sistem azuriran"

# ============================================================================
# KORAK 2: INSTALACIJA NODE.JS
# ============================================================================
print_header "KORAK 2/10: Instalacija Node.js 20.x"
if command -v node &> /dev/null; then
    print_warning "Node.js je vec instaliran ($(node --version))"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js instaliran ($(node --version))"
fi

# ============================================================================
# KORAK 3: INSTALACIJA BUN
# ============================================================================
print_header "KORAK 3/10: Instalacija Bun"
if command -v bun &> /dev/null; then
    print_warning "Bun je vec instaliran ($(bun --version))"
else
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    # Dodaj u .bashrc za sve korisnike
    if ! grep -q "BUN_INSTALL" /root/.bashrc; then
        echo 'export BUN_INSTALL="$HOME/.bun"' >> /root/.bashrc
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> /root/.bashrc
    fi
    print_success "Bun instaliran ($(bun --version))"
fi

# ============================================================================
# KORAK 4: INSTALACIJA GIT
# ============================================================================
print_header "KORAK 4/10: Instalacija Git"
if command -v git &> /dev/null; then
    print_warning "Git je vec instaliran ($(git --version))"
else
    apt install -y git
    print_success "Git instaliran ($(git --version))"
fi

# ============================================================================
# KORAK 5: INSTALACIJA PM2
# ============================================================================
print_header "KORAK 5/10: Instalacija PM2"
if command -v pm2 &> /dev/null; then
    print_warning "PM2 je vec instaliran ($(pm2 --version))"
else
    npm install -g pm2
    print_success "PM2 instaliran ($(pm2 --version))"
fi

# ============================================================================
# KORAK 6: KLONIRANJE WEB PORTALA SA GITHUB
# ============================================================================
print_header "KORAK 6/10: Kloniranje web-admin-portal sa GitHub"

PROJECT_DIR="/root/web-admin-portal"

if [ -d "$PROJECT_DIR" ]; then
    print_warning "Direktorijum vec postoji. Preuzimam najnovije promene..."
    cd "$PROJECT_DIR"
    git pull origin main || print_warning "Git pull nije uspeo - koristim postojece fajlove"
else
    print_warning "Kloniram repozitorijum..."
    git clone https://github.com/igivlahovic-srb/web-admin-portal.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

print_success "Web portal preuzet u: $PROJECT_DIR"

# ============================================================================
# KORAK 7: KREIRANJE DATA DIREKTORIJUMA I .ENV FAJLA
# ============================================================================
print_header "KORAK 7/10: Konfigurisanje environment-a"

# Kreiraj data direktorijum
mkdir -p "$PROJECT_DIR/data"
print_success "Data direktorijum kreiran"

# Kreiraj .env.local fajl ako ne postoji
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    cat > "$PROJECT_DIR/.env.local" <<EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# Data Directory
DATA_DIR=./data

# Optional API Keys
# OPENAI_API_KEY=your_key_here
EOF
    print_success ".env.local fajl kreiran"
else
    print_warning ".env.local vec postoji - preskacemo"
fi

# ============================================================================
# KORAK 8: INSTALACIJA DEPENDENCIES I BUILD
# ============================================================================
print_header "KORAK 8/10: Instalacija paketa i build"

cd "$PROJECT_DIR"

# Instaliraj dependencies
print_warning "Instalacija dependencies (ovo moze potrajati)..."
bun install

# Build projekta
print_warning "Build Next.js aplikacije (ovo moze potrajati)..."
bun run build

print_success "Build zavrsen!"

# ============================================================================
# KORAK 9: POKRETANJE SA PM2
# ============================================================================
print_header "KORAK 9/10: Pokretanje aplikacije sa PM2"

# Zaustavi prethodnu instancu ako postoji
pm2 delete web-admin-portal 2>/dev/null || true

# Pokreni sa PM2
cd "$PROJECT_DIR"
pm2 start bun --name "web-admin-portal" -- run start

# Omoguci auto-start
pm2 startup systemd -u root --hp /root || true
pm2 save

print_success "Aplikacija pokrenuta sa PM2"
print_success "Status: $(pm2 status web-admin-portal)"

# ============================================================================
# KORAK 10: INSTALACIJA I KONFIGURISANJE NGINX
# ============================================================================
print_header "KORAK 10/10: Konfigurisanje Nginx"

# Instaliraj Nginx
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    print_success "Nginx instaliran"
else
    print_warning "Nginx je vec instaliran"
fi

# Kreiraj Nginx konfiguraciju
SERVER_IP=$(hostname -I | awk '{print $1}')

cat > /etc/nginx/sites-available/web-admin-portal <<EOF
server {
    listen 80;
    server_name admin.lafantanasrb.local $SERVER_IP localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/web-admin-portal-access.log;
    error_log /var/log/nginx/web-admin-portal-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600";
    }
}
EOF

# Omoguci sajt
ln -sf /etc/nginx/sites-available/web-admin-portal /etc/nginx/sites-enabled/

# Ukloni default sajt ako postoji
rm -f /etc/nginx/sites-enabled/default

# Testiraj Nginx konfiguraciju
nginx -t

# Restartuj Nginx
systemctl restart nginx
systemctl enable nginx

print_success "Nginx konfigurisan i pokrenut"

# ============================================================================
# KORAK 11: KONFIGURISANJE FIREWALL-A
# ============================================================================
print_header "Konfigurisanje UFW Firewall-a"

if command -v ufw &> /dev/null; then
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
    print_success "Firewall konfigurisan"
else
    print_warning "UFW nije instaliran - preskacemo firewall konfiguraciju"
fi

# ============================================================================
# FINALNO - PRIKAZ INFORMACIJA
# ============================================================================
print_header "DEPLOYMENT ZAVRSEN!"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    DEPLOYMENT USPEŠAN!                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Web Portal URL:${NC}"
echo -e "   http://$SERVER_IP"
echo -e "   http://admin.lafantanasrb.local (konfigurisite DNS)"
echo ""
echo -e "${BLUE}🔑 Login Kredencijali:${NC}"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}📱 Mobilna Aplikacija - Konekcija:${NC}"
echo -e "   1. Otvorite mobilnu aplikaciju"
echo -e "   2. Prijavite se kao admin"
echo -e "   3. Idite na: Profil → Settings"
echo -e "   4. Unesite URL: ${GREEN}http://$SERVER_IP:3000${NC}"
echo -e "   5. Kliknite 'Testiraj konekciju'"
echo -e "   6. Kliknite 'Sinhronizuj sada'"
echo ""
echo -e "${BLUE}🔧 Korisne Komande:${NC}"
echo -e "   Provera statusa:  ${YELLOW}pm2 status${NC}"
echo -e "   Provera logova:   ${YELLOW}pm2 logs web-admin-portal${NC}"
echo -e "   Restart:          ${YELLOW}pm2 restart web-admin-portal${NC}"
echo -e "   Nginx status:     ${YELLOW}systemctl status nginx${NC}"
echo -e "   Update sa GitHub: ${YELLOW}cd $PROJECT_DIR && git pull && bun install && bun run build && pm2 restart web-admin-portal${NC}"
echo ""
echo -e "${GREEN}✓ Sve je spremno za upotrebu!${NC}"
echo ""

# Prikaz PM2 statusa
pm2 status

# Kraj scripta
exit 0

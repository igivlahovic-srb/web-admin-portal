#!/bin/bash

###############################################################################
# La Fantana WHS - Pre-deployment Test Script
# Testira sve kritične komponente pre puštanja u produkciju
###############################################################################

set -e

# Boje
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_test() {
    echo -e "${BLUE}▶ Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}  ✓ PASS:${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}  ✗ FAIL:${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}  ⚠ WARN:${NC} $1"
}

###############################################################################
# TEST 1: Provera Node.js i Bun
###############################################################################

print_header "TEST 1: Node.js i Bun instalacija"

print_test "Node.js instalacija"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_pass "Node.js instaliran: $NODE_VERSION"
else
    print_fail "Node.js nije instaliran!"
fi

print_test "Bun instalacija"
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    print_pass "Bun instaliran: v$BUN_VERSION"
else
    print_fail "Bun nije instaliran!"
fi

###############################################################################
# TEST 2: Provera projekta
###############################################################################

print_header "TEST 2: Struktura projekta"

print_test "package.json"
if [ -f "package.json" ]; then
    print_pass "package.json postoji"
else
    print_fail "package.json ne postoji!"
fi

print_test "node_modules"
if [ -d "node_modules" ]; then
    print_pass "node_modules folder postoji"
else
    print_fail "node_modules ne postoji - pokreni 'bun install'"
fi

print_test "Build folder (.next)"
if [ -d ".next" ]; then
    print_pass ".next build folder postoji"
else
    print_fail ".next ne postoji - pokreni 'bun run build'"
fi

print_test "App folder"
if [ -d "app" ]; then
    print_pass "app folder postoji"
else
    print_fail "app folder ne postoji!"
fi

###############################################################################
# TEST 3: Provera portova
###############################################################################

print_header "TEST 3: Portovi i network"

print_test "Port 3002 (production)"
if ! sudo lsof -i :3002 &> /dev/null; then
    print_pass "Port 3002 je slobodan"
else
    PID=$(sudo lsof -ti :3002)
    print_warn "Port 3002 je zauzet (PID: $PID)"
fi

print_test "Port 3000 (development)"
if ! sudo lsof -i :3000 &> /dev/null; then
    print_pass "Port 3000 je slobodan"
else
    PID=$(sudo lsof -ti :3000)
    print_warn "Port 3000 je zauzet (PID: $PID)"
fi

print_test "Port 80 (HTTP)"
if ! sudo lsof -i :80 &> /dev/null; then
    print_pass "Port 80 je slobodan"
else
    print_warn "Port 80 je zauzet (verovatno Nginx)"
fi

###############################################################################
# TEST 4: Firewall
###############################################################################

print_header "TEST 4: Firewall konfiguracija"

if command -v ufw &> /dev/null; then
    print_test "UFW instalacija"
    print_pass "UFW je instaliran"

    print_test "Port 3002 u firewall-u"
    if sudo ufw status | grep -q "3002"; then
        print_pass "Port 3002 je otvoren u firewall-u"
    else
        print_warn "Port 3002 nije otvoren - pokreni: sudo ufw allow 3002/tcp"
    fi

    print_test "Port 22 (SSH) u firewall-u"
    if sudo ufw status | grep -q "22"; then
        print_pass "Port 22 (SSH) je otvoren"
    else
        print_fail "Port 22 (SSH) nije otvoren - OPASNOST!"
    fi
else
    print_warn "UFW nije instaliran - firewall nije konfigurisan"
fi

###############################################################################
# TEST 5: PM2 ili systemd
###############################################################################

print_header "TEST 5: Process manager"

print_test "PM2 instalacija"
if command -v pm2 &> /dev/null; then
    print_pass "PM2 je instaliran"

    print_test "PM2 water-admin proces"
    if pm2 list | grep -q "water-admin"; then
        STATUS=$(pm2 list | grep "water-admin" | awk '{print $10}')
        if [ "$STATUS" = "online" ]; then
            print_pass "water-admin proces radi (online)"
        else
            print_fail "water-admin proces postoji ali nije online: $STATUS"
        fi
    else
        print_warn "water-admin proces nije registrovan u PM2"
    fi
else
    print_warn "PM2 nije instaliran"
fi

print_test "Systemd service"
if [ -f "/etc/systemd/system/water-admin.service" ]; then
    print_pass "water-admin.service postoji"

    if sudo systemctl is-active --quiet water-admin; then
        print_pass "water-admin service je aktivan"
    else
        print_fail "water-admin service postoji ali nije aktivan"
    fi
else
    print_warn "Systemd service nije konfigurisan"
fi

###############################################################################
# TEST 6: Nginx
###############################################################################

print_header "TEST 6: Nginx reverse proxy (opciono)"

if command -v nginx &> /dev/null; then
    print_test "Nginx instalacija"
    print_pass "Nginx je instaliran"

    print_test "Nginx status"
    if sudo systemctl is-active --quiet nginx; then
        print_pass "Nginx je aktivan"
    else
        print_fail "Nginx nije aktivan"
    fi

    print_test "water-admin Nginx config"
    if [ -f "/etc/nginx/sites-available/water-admin" ]; then
        print_pass "Nginx config postoji"

        if [ -L "/etc/nginx/sites-enabled/water-admin" ]; then
            print_pass "Config je aktiviran (symlink postoji)"
        else
            print_warn "Config nije aktiviran - nema symlink-a"
        fi
    else
        print_warn "Nginx config za water-admin ne postoji"
    fi

    print_test "Nginx konfiguracija sintaksa"
    if sudo nginx -t &> /dev/null; then
        print_pass "Nginx konfiguracija je validna"
    else
        print_fail "Nginx konfiguracija ima greške!"
    fi
else
    print_warn "Nginx nije instaliran (opciono)"
fi

###############################################################################
# TEST 7: HTTP testovi
###############################################################################

print_header "TEST 7: HTTP endpoints"

print_test "HTTP zahtev na localhost:3002"
if curl -f -s http://localhost:3002 > /dev/null 2>&1; then
    print_pass "HTTP zahtev uspešan na localhost:3002"
else
    print_warn "HTTP zahtev neuspešan - server možda nije pokrenut"
fi

print_test "Health check endpoint"
if curl -f -s http://localhost:3002/api/health > /dev/null 2>&1; then
    print_pass "/api/health endpoint radi"
else
    print_warn "/api/health endpoint nedostupan"
fi

print_test "Auth endpoint"
if curl -f -s http://localhost:3002/api/auth > /dev/null 2>&1; then
    print_pass "/api/auth endpoint radi"
else
    print_warn "/api/auth endpoint nedostupan"
fi

###############################################################################
# TEST 8: Sigurnost
###############################################################################

print_header "TEST 8: Sigurnosne provere"

print_test "SSH PermitRootLogin"
if grep -q "^PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null; then
    print_pass "Root SSH login je onemogućen"
else
    print_warn "Root SSH login je omogućen - preporučuje se PermitRootLogin no"
fi

print_test "Unattended upgrades"
if dpkg -l | grep -q unattended-upgrades; then
    print_pass "Automatski security update-i su instalirani"
else
    print_warn "Automatski security update-i nisu instalirani"
fi

print_test "File permissions"
if [ -w "package.json" ]; then
    print_pass "Fajl permissions su OK"
else
    print_fail "Fajl permissions problem - ne možeš pisati u folder"
fi

###############################################################################
# TEST 9: Network
###############################################################################

print_header "TEST 9: Network konfiguracija"

print_test "Internet konekcija"
if ping -c 1 google.com &> /dev/null; then
    print_pass "Internet konekcija radi"
else
    print_fail "Nema internet konekcije!"
fi

print_test "IP adresa"
IP_ADDR=$(hostname -I | awk '{print $1}')
if [ -n "$IP_ADDR" ]; then
    print_pass "Server IP adresa: $IP_ADDR"
else
    print_fail "Ne mogu da pronađem IP adresu!"
fi

###############################################################################
# TEST 10: Disk prostor
###############################################################################

print_header "TEST 10: Resursi sistema"

print_test "Disk prostor"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_pass "Disk prostor OK: ${DISK_USAGE}% iskorišćeno"
else
    print_warn "Disk prostor nizak: ${DISK_USAGE}% iskorišćeno"
fi

print_test "RAM memorija"
RAM_TOTAL=$(free -m | awk 'NR==2 {print $2}')
if [ "$RAM_TOTAL" -gt 500 ]; then
    print_pass "RAM memorija OK: ${RAM_TOTAL}MB"
else
    print_warn "Niska RAM memorija: ${RAM_TOTAL}MB"
fi

###############################################################################
# REZULTATI
###############################################################################

print_header "REZULTATI TESTIRANJA"

TOTAL=$((PASSED + FAILED))

echo -e "${GREEN}✓ Prošlo:${NC} $PASSED/$TOTAL testova"
echo -e "${RED}✗ Palo:${NC} $FAILED/$TOTAL testova"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 SVE TESTOVE PROŠLI! Spreman za produkciju!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Pristup web admin panelu:${NC}"
    echo -e "  ${GREEN}http://$IP_ADDR:3002${NC}"
    echo ""
    echo -e "${BLUE}Login kredencijali:${NC}"
    echo -e "  Username: ${YELLOW}admin${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo ""
    echo -e "${RED}⚠️  NE ZABORAVI DA PROMENIŠ DEFAULT LOZINKU!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  Neki testovi nisu prošli!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Proveri detalje iznad i ispravi probleme pre produkcije."
    echo ""
    echo "Dokumentacija:"
    echo "  - UBUNTU_INSTALL.md (Troubleshooting sekcija)"
    echo "  - INSTALL_CHECKLIST.md"
    echo ""
    exit 1
fi

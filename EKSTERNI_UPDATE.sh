#!/bin/bash
# EKSTERNI UPDATE SCRIPT - Pokrećete direktno na serveru, ne kroz web portal
# Rešenje za "bun not found" problem

echo "=========================================="
echo "La Fantana WHS Portal - Eksterni Update"
echo "=========================================="
echo ""

# Detect directory
if [ -d "/home/user/webadminportal/web-admin" ]; then
    WEB_DIR="/home/user/webadminportal/web-admin"
elif [ -d "$HOME/webadminportal/web-admin" ]; then
    WEB_DIR="$HOME/webadminportal/web-admin"
elif [ -d "web-admin" ]; then
    WEB_DIR="$(pwd)/web-admin"
elif [ -f "package.json" ]; then
    WEB_DIR="$(pwd)"
else
    echo "❌ Ne mogu da pronađem web-admin direktorijum!"
    echo "Pokrenite iz ~/webadminportal/ ili ~/webadminportal/web-admin/"
    exit 1
fi

echo "✓ Pronađen direktorijum: $WEB_DIR"
cd "$WEB_DIR"
echo ""

# Step 1: Git pull (optional, skip if fails)
echo "1/7: Preuzimanje novih izmena..."
git pull vibecode main 2>/dev/null || git pull origin main 2>/dev/null || echo "  (git pull preskočen)"
echo ""

# Step 2: Stop portal
echo "2/7: Zaustavljanje portala..."
pm2 stop lafantana-whs-admin 2>/dev/null || echo "  (portal nije bio pokrenut)"
echo ""

# Step 3: Clean
echo "3/7: Čišćenje cache-a..."
rm -rf .next
rm -rf node_modules/.cache
rm -f bun.lock
echo "✓ Cache očišćen"
echo ""

# Step 4: Install with npm
echo "4/7: Instalacija sa npm..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install nije uspeo!"
    exit 1
fi
echo "✓ Instalacija uspešna"
echo ""

# Step 5: Build
echo "5/7: Build aplikacije..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build nije uspeo!"
    exit 1
fi
echo "✓ Build uspešan"
echo ""

# Step 6: Start with PM2
echo "6/7: Pokretanje portala..."
pm2 start "npm run start" --name lafantana-whs-admin 2>/dev/null || pm2 restart lafantana-whs-admin
echo "✓ Portal pokrenut"
echo ""

# Step 7: Save PM2
echo "7/7: Čuvanje PM2 konfiguracije..."
pm2 save
echo "✓ Konfiguracija sačuvana"
echo ""

# Wait
sleep 3

echo "=========================================="
echo "✅ UPDATE ZAVRŠEN!"
echo "=========================================="
echo ""

pm2 status

echo ""
echo "Test servera..."
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Portal radi: http://localhost:3002"
else
    echo "⚠️  Portal se još pokreće... sačekajte 10 sekundi"
fi

echo ""
echo "Logovi: pm2 logs lafantana-whs-admin"
echo ""

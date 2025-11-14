#!/bin/bash
# FORCE REBUILD - Forsira potpuno novi build sa cache busting

echo "=========================================="
echo "Force Rebuild - Cache Busting"
echo "=========================================="
echo ""

cd ~/webadminportal/web-admin || { echo "Direktorijum ne postoji!"; exit 1; }

echo "1/5: Stopping portal..."
pm2 stop lafantana-whs-admin 2>/dev/null
echo ""

echo "2/5: Brisanje POTPUNO..."
rm -rf .next
rm -rf .next.bak
rm -rf node_modules/.cache
echo "✓ Cache obrisan"
echo ""

echo "3/5: Rebuild sa novim build ID..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✓ Build uspešan"
echo ""

echo "4/5: Restartovanje..."
pm2 restart lafantana-whs-admin || pm2 start "npm run start" --name lafantana-whs-admin
pm2 save
echo "✓ Portal pokrenut"
echo ""

echo "5/5: Čekanje da se pokrene..."
sleep 5
echo ""

echo "=========================================="
echo "✅ FORCE REBUILD ZAVRŠEN!"
echo "=========================================="
echo ""

pm2 logs lafantana-whs-admin --lines 20

echo ""
echo "SADA:"
echo "1. Zatvorite browser KOMPLETNO (Alt+F4)"
echo "2. Otvorite browser ponovo"
echo "3. Ili otvorite Incognito mode (Ctrl+Shift+N)"
echo "4. Idite na portal"
echo ""

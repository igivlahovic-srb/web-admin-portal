#!/bin/bash

# Water Service Web Admin - Dijagnostička skripta
# Ova skripta pomaže da pronađete i rešite probleme sa konekcijom

echo "======================================"
echo "Water Service Web Admin - Dijagnostika"
echo "======================================"
echo ""

# 1. Provera da li je web server pokrenut
echo "1. Provera web servera..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":3000.*LISTEN"; then
    echo "   ✅ Web server RADI na portu 3000"
else
    echo "   ❌ Web server NE RADI"
    echo "   Pokrenite ga sa: cd web-admin && bun dev"
    echo ""
    exit 1
fi

echo ""

# 2. Provera IP adrese
echo "2. IP adrese ovog računara:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   http://"$2":3000"}'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    hostname -I | awk '{for(i=1;i<=NF;i++) print "   http://"$i":3000"}'
else
    # Pokušaj generičko
    ip addr show 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print "   http://"$2":3000"}' | sed 's/\/.*:/:/g'
fi

echo ""
echo "   Kopirajte jednu od ovih adresa u mobilnu aplikaciju!"
echo "   (Obično je prva adresa prava)"
echo ""

# 3. Test API endpointa
echo "3. Test API endpointa..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ API endpoint /api/health radi"
else
    echo "   ❌ API endpoint ne odgovara (HTTP $RESPONSE)"
fi

echo ""

# 4. Provera firewall-a (Linux)
if command -v ufw &> /dev/null; then
    echo "4. Provera firewall-a (UFW)..."
    if sudo ufw status 2>/dev/null | grep -q "3000.*ALLOW"; then
        echo "   ✅ Port 3000 je dozvoljen u firewall-u"
    else
        echo "   ⚠️  Port 3000 možda nije dozvoljen"
        echo "   Dozvolite ga sa: sudo ufw allow 3000/tcp"
    fi
    echo ""
fi

# 5. Uputstva
echo "======================================"
echo "Sledeći koraci:"
echo "======================================"
echo ""
echo "1. U mobilnoj aplikaciji:"
echo "   - Idite na Profil → Settings"
echo "   - Sačuvajte jednu od IP adresa iznad"
echo "   - Kliknite 'Testiraj konekciju'"
echo ""
echo "2. Ako ne radi:"
echo "   - Proverite da li su telefon i računar na istoj WiFi mreži"
echo "   - Isključite firewall privremeno za testiranje"
echo "   - Pokušajte drugu IP adresu sa liste"
echo ""
echo "3. Za pomoć:"
echo "   - Pročitajte README.md"
echo "   - Pročitajte web-admin/README.md"
echo ""

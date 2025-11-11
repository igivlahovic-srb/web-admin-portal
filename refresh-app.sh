#!/bin/bash

# La Fantana WHS - Quick Refresh Script
# Ovaj script čisti cache i restartuje aplikaciju za iOS i Android

echo "🔄 La Fantana WHS - Quick Refresh"
echo "=================================="
echo ""

# Pitaj korisnika šta želi
echo "Izaberite opciju:"
echo "1) Jednostavan reload (brzo)"
echo "2) Očisti cache i restart (preporučeno)"
echo "3) Potpuno čišćenje (sporo, ali garantovano)"
echo ""
read -p "Izbor (1-3): " choice

case $choice in
  1)
    echo ""
    echo "✨ Jednostavan reload..."
    echo "Pritisnite 'r' u Metro bundler terminalu za reload"
    echo "Ili 'shift+r' za reload sa cache clear"
    ;;
  2)
    echo ""
    echo "🧹 Čišćenje Expo cache..."
    rm -rf .expo
    rm -rf node_modules/.cache 2>/dev/null

    echo "✅ Cache očišćen!"
    echo ""
    echo "🚀 Pokretanje sa čistim cache-om..."
    bun start --clear
    ;;
  3)
    echo ""
    echo "🧹 Potpuno čišćenje..."
    rm -rf .expo
    rm -rf node_modules/.cache 2>/dev/null
    rm -rf $TMPDIR/metro-* 2>/dev/null
    rm -rf $TMPDIR/haste-* 2>/dev/null

    echo "✅ Svi cache-ovi očišćeni!"
    echo ""
    echo "🚀 Pokretanje sa potpuno čistim cache-om..."
    bun start --clear --reset-cache
    ;;
  *)
    echo "❌ Nepoznat izbor!"
    exit 1
    ;;
esac

echo ""
echo "📱 Za reload na uređaju:"
echo "   iOS: Shake device ili Cmd+D (simulator) → Reload"
echo "   Android: Shake device ili Cmd+M → Reload"
echo ""
echo "💡 Ako aplikacija ne prikazuje promene:"
echo "   - Zatvorite aplikaciju potpuno"
echo "   - Ponovo otvorite i skenirajte QR kod"
echo ""

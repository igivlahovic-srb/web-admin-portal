#!/bin/bash

# Check for Updates Script
# Run this on Ubuntu server to see if there are new changes

echo "================================================"
echo "Provera GitHub Izmena - La Fantana WHS Admin"
echo "================================================"
echo ""

# Fetch latest changes from GitHub
echo "Povezivanje sa GitHub-om..."
git fetch origin main

# Check current commit
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

echo ""
echo "Lokalni commit: $LOCAL_COMMIT"
echo "Remote commit:  $REMOTE_COMMIT"
echo ""

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Sve je ažurirano - nema novih izmena"
    echo ""
    echo "Poslednji commit:"
    git log -1 --pretty=format:"  %h - %s (%ar)" HEAD
    echo ""
else
    echo "🔔 NOVE IZMENE DOSTUPNE!"
    echo ""
    echo "Izmene koje treba preuzeti:"
    git log HEAD..origin/main --oneline --decorate
    echo ""
    echo "Za ažuriranje izvršite:"
    echo "  git pull origin main"
    echo "  cd web-admin"
    echo "  rm -rf .next node_modules"
    echo "  bun install"
    echo "  bun run build"
    echo "  pm2 restart water-service-web-admin"
fi

echo ""
echo "================================================"

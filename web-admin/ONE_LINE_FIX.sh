#!/bin/bash
# ONE-LINE FIX - Za "bun not found" grešku
# Kopirajte komande ispod direktno u terminal

cd ~/webadminportal/web-admin && pm2 stop lafantana-whs-admin 2>/dev/null; pm2 delete lafantana-whs-admin 2>/dev/null; rm -rf .next node_modules/.cache bun.lock package-lock.json; npm install && npm run build && pm2 start "npm run start" --name lafantana-whs-admin && pm2 save && echo "✅ Portal je ažuriran! Proverite: pm2 status"

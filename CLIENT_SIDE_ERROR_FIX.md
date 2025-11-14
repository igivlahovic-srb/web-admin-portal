# 🔍 DIJAGNOZA - "Application error: a client-side exception"

## 🎯 Šta Ova Greška Znači?

Ova greška znači da:
- ✅ **Portal JE POKRENUT** (server radi)
- ❌ **JavaScript greška u browser-u** (client-side)
- ❌ Build nije kompatibilan ili nedostaju fajlovi

---

## ✅ REŠENJE 1: Potpuni Rebuild Na Serveru

Na **Ubuntu serveru**:

```bash
cd ~/webadminportal/web-admin

# Stop portal
pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin

# Potpuno čišćenje
rm -rf .next
rm -rf node_modules
rm -f bun.lock
rm -f package-lock.json

# Reinstall SVEGA
npm install

# Rebuild
npm run build

# Restart
pm2 start "npm run start" --name lafantana-whs-admin
pm2 save

# Check
pm2 logs lafantana-whs-admin --lines 50
```

---

## ✅ REŠENJE 2: Proverite Browser Console

1. Otvorite portal u Chrome/Firefox
2. Pritisnite **F12** (Developer Tools)
3. Idite na **Console** tab
4. Osvežite stranicu
5. **Kopirajte tačnu grešku** koju vidite

Greška može biti:
```
TypeError: Cannot read property 'X' of undefined
SyntaxError: Unexpected token
ReferenceError: X is not defined
```

---

## ✅ REŠENJE 3: Proverite PM2 Logove

Na serveru:

```bash
pm2 logs lafantana-whs-admin --lines 100
```

Tražite:
- `Error:` poruke
- `TypeError:` poruke
- `Failed to compile` poruke
- `Module not found` poruke

---

## ✅ REŠENJE 4: Clear Browser Cache

Možda browser čuva stare fajlove:

1. **Chrome**: Ctrl+Shift+Delete → Clear cache
2. **Firefox**: Ctrl+Shift+Delete → Clear cache
3. **Ili**: Otvorite Incognito/Private mode

---

## ✅ REŠENJE 5: Provera da Server Radi

```bash
# Na serveru
curl http://localhost:3002

# Trebalo bi da vidite HTML, ne grešku
```

Ako dobijete:
- ✅ HTML sa `<!DOCTYPE html>` → Server radi, problem u browser-u
- ❌ `Connection refused` → Server nije pokrenut
- ❌ `502 Bad Gateway` → PM2/Node process nije pokrenut

---

## ✅ REŠENJE 6: Reinstalirajte Dependencies

Možda je neki npm paket korumpiran:

```bash
cd ~/webadminportal/web-admin

# Brisanje SVE
rm -rf node_modules package-lock.json bun.lock

# Čišćenje npm cache
npm cache clean --force

# Reinstall
npm install

# Rebuild
npm run build

# Restart
pm2 restart lafantana-whs-admin
```

---

## ✅ REŠENJE 7: Proverite .env.local

Možda nedostaje environment variable:

```bash
cd ~/webadminportal/web-admin

# Proverite da li postoji
ls -la .env.local

# Ako ne postoji, kreirajte
cat > .env.local << 'EOF'
# Database configuration (optional)
# DB_SERVER=your-server
# DB_DATABASE=your-database
# DB_USER=your-user
# DB_PASSWORD=your-password
EOF
```

---

## 🔍 Debug Checklist

Korak po korak:

```bash
# 1. Da li server radi?
pm2 status

# 2. Da li Next.js process radi?
ps aux | grep next

# 3. Da li port 3002 radi?
netstat -tulpn | grep 3002

# 4. Da li ima grešaka u logovima?
pm2 logs lafantana-whs-admin --err --lines 50

# 5. Da li .next folder postoji?
ls -la .next/

# 6. Da li build fajlovi postoje?
ls -la .next/server/

# 7. Test curl
curl -I http://localhost:3002
```

---

## 📞 Pošaljite Mi Ove Informacije

Ako ni jedno rešenje ne radi, pošaljite mi:

```bash
# 1. PM2 status
pm2 status

# 2. PM2 logs (poslednji errori)
pm2 logs lafantana-whs-admin --err --lines 50

# 3. Browser console greška (F12 → Console)
# Screenshot ili copy-paste

# 4. Curl test
curl http://localhost:3002
```

---

## ⚡ Brzi One-Liner Fix

```bash
cd ~/webadminportal/web-admin && pm2 stop lafantana-whs-admin && pm2 delete lafantana-whs-admin && rm -rf .next node_modules package-lock.json bun.lock && npm cache clean --force && npm install && npm run build && pm2 start "npm run start" --name lafantana-whs-admin && pm2 save && sleep 5 && curl http://localhost:3002 && echo "Portal test završen"
```

---

**Kopirajte brzi one-liner, pokrenite, i pošaljite mi rezultat!** 🚀

# 🚨 BUN NOT FOUND - HITNO REŠENJE

## Greška koju vidite:
```
command failed: bun install
/bin/sh 1. bun not found
```

---

## ✅ COPY-PASTE REŠENJE (30 sekundi)

### Na Ubuntu serveru, kopirajte OVU jednu liniju:

```bash
cd ~/webadminportal/web-admin && pm2 stop lafantana-whs-admin 2>/dev/null; pm2 delete lafantana-whs-admin 2>/dev/null; rm -rf .next node_modules/.cache bun.lock package-lock.json; npm install && npm run build && pm2 start "npm run start" --name lafantana-whs-admin && pm2 save && pm2 status
```

**Pritisnite ENTER i sačekajte 2-3 minuta.**

---

## ✅ Ili Korak-Po-Korak (ako želite kontrolu)

```bash
# 1. Idite u direktorijum
cd ~/webadminportal/web-admin

# 2. Stoprajte portal
pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin

# 3. Očistite cache
rm -rf .next
rm -rf node_modules/.cache
rm -f bun.lock
rm -f package-lock.json

# 4. Instalirajte sa NPM (ne bun)
npm install

# 5. Build
npm run build

# 6. Pokrenite
pm2 start "npm run start" --name lafantana-whs-admin

# 7. Sačuvajte
pm2 save

# 8. Proverite
pm2 status
```

---

## ✅ Provera Da Li Radi

```bash
pm2 status
```

Trebalo bi da vidite:
```
│ lafantana-whs-admin │ online │
```

Test portal:
```bash
curl http://localhost:3002
```

Pogledaj logove:
```bash
pm2 logs lafantana-whs-admin
```

---

## 🔍 Zašto ovo radi?

**Problem**: Vaš server **NEMA** bun instaliran, ali neki script pokušava da ga koristi.

**Rešenje**: Koristimo **npm** umesto bun-a:
- ✅ npm je već instaliran na Ubuntu
- ✅ npm i bun rade ISTI posao
- ✅ Portal će raditi IDENTIČNO

---

## ⚠️ Ako Dobijete "npm: command not found"

Instalirajte Node.js + npm:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Treba biti 18+
npm --version
```

Zatim pokrenite one-line fix ponovo.

---

## 💡 Ako Želite Bun (Opciono)

```bash
# Instalirajte bun
curl -fsSL https://bun.sh/install | bash

# Dodajte u PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Proverite
bun --version

# Sada možete koristiti bun install
cd ~/webadminportal/web-admin
bun install
bun run build
pm2 restart lafantana-whs-admin
```

---

## 📞 Podrška

Ako ništa ne radi, pošaljite mi output:
```bash
cd ~/webadminportal/web-admin
npm install 2>&1 | tee npm-error.log
cat npm-error.log
```

---

**Kopirajte one-line fix i gotovo za 2 minuta!** 🚀

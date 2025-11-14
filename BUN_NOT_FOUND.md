# BUN NOT FOUND - Brzo Rešenje

## 🔴 Problem
```
bun not found
command failed: bun install
```

**Uzrok**: Bun nije instaliran na Ubuntu serveru.

## ✅ Rešenje 1: Koristite npm (NAJBRŽE)

Kreirao sam specijalan script koji koristi **npm** umesto bun-a:

### Na Ubuntu serveru:
```bash
cd ~/webadminportal/web-admin  # ili gde god je instaliran portal

# Download i pokreni script
chmod +x QUICK_FIX_NPM.sh
./QUICK_FIX_NPM.sh
```

**Ovo će:**
1. ✅ Stopirati stare procese
2. ✅ Očistiti cache
3. ✅ Instalirati dependencies sa **npm** (ne bun)
4. ✅ Build-ovati aplikaciju
5. ✅ Pokrenuti server sa PM2

---

## ✅ Rešenje 2: Instalirajte Bun

Ako želite da koristite bun:

```bash
# Instalirajte bun
curl -fsSL https://bun.sh/install | bash

# Dodajte u PATH
export PATH="$HOME/.bun/bin:$PATH"

# Dodajte u .bashrc da bude permanentno
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Proverite instalaciju
bun --version

# Sada pokrenite normalni REBUILD.sh
cd ~/webadminportal/web-admin
./REBUILD.sh
```

---

## ✅ Rešenje 3: Manuelni Update sa npm

Ako scriptovi ne rade:

```bash
cd ~/webadminportal/web-admin

# 1. Stop server
pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin

# 2. Clean
rm -rf .next
rm -rf node_modules/.cache
rm -f bun.lock

# 3. Install sa npm
npm install

# 4. Build
npm run build

# 5. Start
pm2 start "npm run start" --name lafantana-whs-admin
pm2 save

# 6. Check
pm2 status
pm2 logs lafantana-whs-admin
```

---

## 📋 Šta koristiti?

| Scenario | Koristi |
|----------|---------|
| Bun NIJE instaliran | `QUICK_FIX_NPM.sh` ✅ |
| Bun JE instaliran | `REBUILD.sh` ✅ |
| Želim da instaliram bun | Rešenje 2 ✅ |
| Ništa ne radi | Rešenje 3 (manuelno) ✅ |

---

## ⚡ Najbrži način (Copy-Paste)

```bash
cd ~/webadminportal/web-admin
pm2 stop lafantana-whs-admin 2>/dev/null || true
pm2 delete lafantana-whs-admin 2>/dev/null || true
rm -rf .next node_modules/.cache bun.lock
npm install && npm run build
pm2 start "npm run start" --name lafantana-whs-admin
pm2 save
```

Kopirajte i paste-ujte ove komande direktno u terminal!

---

## 🔍 Provera da li radi

```bash
# Check PM2 status
pm2 status

# Check server
curl http://localhost:3002

# View logs
pm2 logs lafantana-whs-admin
```

---

## ⚠️ Važno

- **npm i bun** rade ISTI posao - oba su ok
- **npm** je obično već instaliran na Ubuntu
- **bun** je brži, ali NIJE obavezan
- Aplikacija će raditi **IDENTIČNO** sa npm ili bun

---

## 📞 Ako ništa ne radi

Pošaljite output:
```bash
cd ~/webadminportal/web-admin
npm install 2>&1 | tee npm-install.log
npm run build 2>&1 | tee npm-build.log
```

I pošaljite `npm-install.log` i `npm-build.log` fajlove.

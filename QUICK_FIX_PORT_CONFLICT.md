# ⚡ Brza Pomoć - Rešavanje PM2 Port Konflikta

## 🔴 Problem: "address already in use :::3002"

Ovo znači da je neki proces već zauzeo port 3002.

## ✅ Brzo Rešenje (COPY-PASTE)

Prijavite se na server i pokrenite sledeće komande:

```bash
# 1. Zaustavite PM2 proces
pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin

# 2. Ubijte proces koji koristi port 3002
lsof -i :3002 | grep LISTEN | awk '{print $2}' | xargs kill -9

# 3. Proverite da li je port oslobođen
lsof -i :3002

# 4. Pokrenite ponovo
cd ~/lafantana-whs-admin
pm2 start npm --name "lafantana-whs-admin" -- start
pm2 save

# 5. Proverite status
pm2 status
pm2 logs lafantana-whs-admin
```

## 📋 Ili koristite automatski skripta

```bash
cd ~/lafantana-whs-admin
./quick-deploy.sh
```

## 🔍 Debug komande

```bash
# Proverite koji proces koristi port 3002
lsof -i :3002

# Proverite PM2 procese
pm2 list

# Pogledajte PM2 logove
pm2 logs lafantana-whs-admin --lines 50

# Pogledajte error log
cat /root/.pm2/logs/lafantana-whs-admin-error.log

# Proverite da li server radi
curl http://localhost:3002/api/health
```

## 🚨 Ako problem persista

### Opcija 1: Promenite port

Edit `package.json`:
```json
"start": "next start -p 3003"
```

Zatim:
```bash
pm2 delete lafantana-whs-admin
pm2 start npm --name "lafantana-whs-admin" -- start
pm2 save
```

### Opcija 2: Resetujte PM2

```bash
pm2 kill
pm2 start npm --name "lafantana-whs-admin" --cwd ~/lafantana-whs-admin -- start
pm2 save
```

### Opcija 3: Restartujte server

```bash
sudo reboot
```

Nakon restart-a, ponovo pokrenite:
```bash
pm2 resurrect
# ili
pm2 start npm --name "lafantana-whs-admin" --cwd ~/lafantana-whs-admin -- start
```

## 📞 Dodatna pomoć

Ako ništa od ovoga ne radi, pošaljite output sledećih komandi:

```bash
pm2 list
lsof -i :3002
netstat -tulpn | grep 3002
cat /root/.pm2/logs/lafantana-whs-admin-error.log
```

---

**Brzi kontakt informacije:**
- Port: 3002
- Proces: lafantana-whs-admin
- Lokacija: ~/lafantana-whs-admin
- URL: http://IP_ADRESE:3002

# 🚀 Deployment Guide - LaFantana WHS Admin Portal

## 📍 Nova struktura projekata

**VAŽNO:** Projekti su sada odvojeni:

- **Mobilna aplikacija:** `/home/user/workspace/` (React Native + Expo)
- **Web Admin Portal:** `/home/user/lafantana-whs-admin/` (Next.js)

## 🔧 Deployment na Production Server

### 1. Kopirajte portal na server

```bash
# Sa vašeg lokalnog računara
scp -r /home/user/lafantana-whs-admin root@lftaserver-appserver:~/
```

### 2. Prijavite se na server

```bash
ssh root@lftaserver-appserver
```

### 3. Zaustavite stari PM2 proces

```bash
# Prvo proverite PM2 procese
pm2 list

# Zaustavite i obrišite stari proces
pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin

# Ako port 3002 je još uvek zauzet, ubijte proces
lsof -i :3002 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### 4. Instalirajte dependencies

```bash
cd ~/lafantana-whs-admin
bun install
# ili ako nemate bun:
npm install
```

### 5. Build projekat

```bash
bun run build
# ili:
npm run build
```

### 6. Pokrenite sa PM2

```bash
pm2 start npm --name "lafantana-whs-admin" -- start
pm2 save
```

### 7. Proverite status

```bash
pm2 status
pm2 logs lafantana-whs-admin
```

## 🌐 Pristup

Web admin portal će biti dostupan na:
- **Lokalno:** http://localhost:3002
- **Sa mreže:** http://IP_ADRESA_SERVERA:3002

**Credentials:**
- Username: `admin`
- Password: `admin123`

## 🔄 Kako funkcioniše komunikacija sa mobilnom aplikacijom

### API Endpoints (Web Admin Portal)

Web admin portal pruža sledeće API endpoint-e:

- `GET /api/health` - Health check
- `GET /api/sync/users` - Preuzmi korisnike
- `POST /api/sync/users` - Sinhronizuj korisnike sa mobilne
- `GET /api/sync/tickets` - Preuzmi tikete
- `POST /api/sync/tickets` - Sinhronizuj tikete sa mobilne
- `POST /api/workday/close` - Zatvori radni dan
- `POST /api/workday/open` - Otvori radni dan (admin only)
- `GET /api/spare-parts` - Preuzmi rezervne delove iz SQL baze

### Mobilna aplikacija - API Client

Mobilna aplikacija ima prebuilt API client u:
- **Fajl:** `/home/user/workspace/src/api/web-admin-sync.ts`

Ovaj client već implementira sve potrebne funkcije za komunikaciju.

## 📱 Konfiguracija na mobilnoj aplikaciji

### 1. Postavite URL web admin portala

U mobilnoj aplikaciji, admin korisnik može:
1. Ići na **Profil** tab
2. Kliknuti na **Web Admin Sync** sekciju
3. Uneti URL portala (npr. `http://192.168.1.100:3002`)
4. Testirati konekciju
5. Sinhronizovati podatke

### 2. Za lokalno testiranje

Pronađite IP adresu servera:

**Linux/Ubuntu:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
```

Zatim koristite taj IP u mobilnoj aplikaciji: `http://YOUR_IP:3002`

### 3. Za remote pristup (preko interneta)

Koristite ngrok ili otvorite port 3002 na firewall-u:

**Sa ngrok:**
```bash
ngrok http 3002
```

**Firewall (Ubuntu):**
```bash
sudo ufw allow 3002/tcp
sudo ufw reload
```

## 🔐 MSSQL Baza podataka

Web admin portal se povezuje na MSSQL bazu za:
- Rezervne delove
- Istoriju servisa
- Dodatne podatke

### Konfiguracija (.env)

Kreirajte `.env` fajl u `/home/user/lafantana-whs-admin/`:

```env
DB_SERVER=your-sql-server.database.windows.net
DB_DATABASE=lafantana-whs
DB_USER=sqladmin
DB_PASSWORD=your-password
DB_PORT=1433
DB_ENCRYPT=true
```

## 🛠️ Troubleshooting

### Problem: Port 3002 je zauzet

```bash
# Pronađite proces
lsof -i :3002

# Ubijte proces
kill -9 <PID>

# Ili promenite port u package.json
"start": "next start -p 3003"
```

### Problem: PM2 proces se restartuje stalno

```bash
# Proverite logove
pm2 logs lafantana-whs-admin --lines 50

# Proverite error log
cat ~/.pm2/logs/lafantana-whs-admin-error.log
```

### Problem: Cannot connect to SQL database

```bash
# Proverite .env fajl
cat .env

# Testirajte konekciju
node -e "require('mssql').connect(require('dotenv').config().parsed)"
```

### Problem: Mobilna aplikacija ne može da se poveže

1. Proverite da li web admin radi: `curl http://localhost:3002/api/health`
2. Proverite firewall: `sudo ufw status`
3. Proverite da li su na istoj mreži (za lokalni pristup)
4. Koristite ngrok za remote pristup

## 📊 Monitoring

```bash
# PM2 monitoring
pm2 monit

# Real-time logovi
pm2 logs lafantana-whs-admin --lines 100 -f

# Restart ako je potrebno
pm2 restart lafantana-whs-admin

# Stop
pm2 stop lafantana-whs-admin
```

## 🔄 Update procedure

Kada želite da ažurirate portal:

```bash
# 1. Backup
cd ~
tar -czf lafantana-whs-admin-backup-$(date +%Y%m%d).tar.gz lafantana-whs-admin/

# 2. Zaustavite PM2
pm2 stop lafantana-whs-admin

# 3. Kopirajte nove fajlove
# (sa lokalnog računara ili git pull)

# 4. Install dependencies
cd ~/lafantana-whs-admin
bun install

# 5. Build
bun run build

# 6. Restart PM2
pm2 restart lafantana-whs-admin
```

## ✅ Verifikacija

Nakon deployment-a, proverite:

- [ ] PM2 proces radi: `pm2 list`
- [ ] Web portal je dostupan: `curl http://localhost:3002`
- [ ] Health check radi: `curl http://localhost:3002/api/health`
- [ ] Možete se prijaviti preko browser-a
- [ ] Mobilna aplikacija se može povezati
- [ ] Sinhronizacija radi

---

**Verzija:** 2.1.0
**Autor:** LaFantana WHS Team
**Datum:** November 2025

# 🌊 LaFantana WHS - Web Admin Portal

Web admin portal za upravljanje LaFantana Water Service aplikacijom.

**Verzija:** 2.1.0
**Framework:** Next.js 15 + React 18
**Port:** 3002

---

## ⚠️ VAŽNO: Projekti su razdvojeni!

Ovaj projekat je **odvojen** od mobilne aplikacije.

- **Web Admin Portal:** `/home/user/lafantana-whs-admin/` (ovaj folder)
- **Mobilna aplikacija:** `/home/user/workspace/`

Komunikacija između njih se vrši preko REST API endpoint-a.

---

## 🚀 Quick Start

### Za production deployment:

```bash
# 1. Kopiraj projekat na server
scp -r /home/user/lafantana-whs-admin root@lftaserver-appserver:~/

# 2. SSH na server
ssh root@lftaserver-appserver

# 3. Pokreni automatski deploy skripta
cd ~/lafantana-whs-admin
./quick-deploy.sh
```

### Manuelno deployment:

```bash
cd ~/lafantana-whs-admin

# Install dependencies
bun install  # ili: npm install

# Build
bun run build  # ili: npm run build

# Start sa PM2
pm2 start npm --name "lafantana-whs-admin" -- start
pm2 save

# Proveri status
pm2 logs lafantana-whs-admin
```

---

## 🌐 Pristup

Nakon deployment-a, portal je dostupan na:
- **Lokalno:** http://localhost:3002
- **Sa mreže:** http://IP_ADRESE_SERVERA:3002

**Login kredencijali:**
- **Username:** admin
- **Password:** admin123

Samo korisnici sa `role: "super_user"` mogu pristupiti portalu.

---

## 🔄 API Endpoints za mobilnu aplikaciju

Portal pruža sledeće API endpoint-e:

### Health & Status
- `GET /api/health` - Health check

### Sinhronizacija
- `GET /api/sync/users` - Preuzmi korisnike
- `POST /api/sync/users` - Sinhronizuj korisnike sa mobilne
- `GET /api/sync/tickets` - Preuzmi tikete
- `POST /api/sync/tickets` - Sinhronizuj tikete sa mobilne

### Workday Management
- `POST /api/workday/close` - Zatvori radni dan
- `POST /api/workday/open` - Otvori radni dan (admin only)

### MSSQL Integracija
- `GET /api/spare-parts` - Rezervni delovi iz SQL baze

Mobilna aplikacija ima prebuilt API client koji koristi ove endpoint-e:
**Lokacija:** `/home/user/workspace/src/api/web-admin-sync.ts`

---

## 📱 Kako konfigurisati mobilnu aplikaciju

1. U mobilnoj aplikaciji, prijavite se kao **admin**
2. Idite na **Profil** tab
3. Kliknite na **Web Admin Sync**
4. Unesite URL portala: `http://YOUR_SERVER_IP:3002`
5. Kliknite **Test Connection**
6. Ako je uspešno, kliknite **Sync Now**

---

## 🛠️ Troubleshooting

### Problem: Port 3002 već zauzet

```bash
pm2 stop lafantana-whs-admin
pm2 delete lafantana-whs-admin
lsof -i :3002 | grep LISTEN | awk '{print $2}' | xargs kill -9
pm2 start npm --name "lafantana-whs-admin" -- start
```

**Ili pogledajte:** `QUICK_FIX_PORT_CONFLICT.md`

### Problem: PM2 se restartuje stalno

```bash
pm2 logs lafantana-whs-admin --lines 50
```

Najčešći razlog: MSSQL konekcija nije konfigurisana. Pogledajte `MSSQL_INTEGRATION.md`.

### Problem: Mobilna aplikacija se ne može povezati

1. Proverite da li portal radi: `curl http://localhost:3002/api/health`
2. Proverite firewall: `sudo ufw allow 3002/tcp`
3. Koristite IP adresu umesto `localhost` u mobilnoj aplikaciji
4. Za remote pristup, koristite ngrok: `ngrok http 3002`

---

## 📊 Korisne komande

```bash
# Status
pm2 status

# Logovi (real-time)
pm2 logs lafantana-whs-admin -f

# Restart
pm2 restart lafantana-whs-admin

# Stop
pm2 stop lafantana-whs-admin

# Monitoring
pm2 monit

# Proveri health
curl http://localhost:3002/api/health
```

---

## 🗂️ Struktura projekta

```
lafantana-whs-admin/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Login stranica
│   ├── dashboard/                # Dashboard
│   ├── users/                    # Upravljanje korisnicima
│   ├── services/                 # Pregled servisa
│   └── api/                      # API routes
│       ├── health/               # Health check
│       ├── sync/                 # Sync endpoints
│       ├── workday/              # Workday management
│       └── spare-parts/          # MSSQL integracija
├── components/                   # React komponente
├── lib/                          # Utils & helpers
├── public/                       # Static assets
├── DEPLOY_TO_SERVER.md           # 📖 Deployment guide (detaljno)
├── QUICK_FIX_PORT_CONFLICT.md    # ⚡ Brzo rešenje za port konflikt
├── quick-deploy.sh               # 🚀 Automatski deploy skripta
├── MSSQL_INTEGRATION.md          # 🗄️ SQL baza setup
└── package.json
```

---

## 📚 Dokumentacija

- **`DEPLOY_TO_SERVER.md`** - Kompletan deployment guide
- **`QUICK_FIX_PORT_CONFLICT.md`** - Brzo rešenje za port probleme
- **`MSSQL_INTEGRATION.md`** - SQL baza konfiguracija
- **`quick-deploy.sh`** - Automatski deployment skripta

---

## 🔐 MSSQL Konfiguracija

Kreirajte `.env` fajl:

```env
DB_SERVER=your-server.database.windows.net
DB_DATABASE=lafantana-whs
DB_USER=sqladmin
DB_PASSWORD=your-password
DB_PORT=1433
DB_ENCRYPT=true
```

Više detalja u `MSSQL_INTEGRATION.md`.

---

## 🔄 Update Procedure

```bash
# 1. Backup
cd ~
tar -czf lafantana-whs-admin-backup-$(date +%Y%m%d).tar.gz lafantana-whs-admin/

# 2. Zaustavi
pm2 stop lafantana-whs-admin

# 3. Kopiraj nove fajlove (ili git pull)

# 4. Install & Build
cd ~/lafantana-whs-admin
bun install
bun run build

# 5. Restart
pm2 restart lafantana-whs-admin
pm2 save
```

---

## 📦 Backup

Trenutni backup (sa mobilnom aplikacijom):
```
/home/user/workspace-backup-20251111-180036.tar.gz (331MB)
```

Kreiraj novi backup:
```bash
cd ~
tar -czf lafantana-whs-admin-backup-$(date +%Y%m%d).tar.gz lafantana-whs-admin/
```

---

## ✅ Pre-Deployment Checklist

- [ ] PM2 je instaliran na serveru
- [ ] Node.js/Bun je instaliran
- [ ] Port 3002 je slobodan
- [ ] Firewall dozvoljava port 3002
- [ ] MSSQL kredencijali su konfigurisani (`.env`)
- [ ] Projekat je kopiran na server
- [ ] `quick-deploy.sh` je executable (`chmod +x`)

---

## 🎯 Features

### Dashboard
- Statistika korisnika (ukupno, aktivni, neaktivni)
- Statistika servisa (ukupno, u toku, završeni)
- Brze akcije

### Upravljanje korisnicima
- Dodaj nove korisnike
- Izmeni postojeće
- Deaktiviraj/aktiviraj naloge
- Obriši korisnike
- Zaštita: Ne možete obrisati/deaktivirati svoj nalog

### Pregled servisa
- Lista svih servisnih naloga
- Detalji: operacije, rezervni delovi, napomene
- Filter po korisniku i statusu
- Datum i vreme servisa

### Sinhronizacija
- Automatska sinhronizacija sa mobilnom aplikacijom
- Real-time sync korisnika i tiketa
- Workday management (zatvaranje/otvaranje radnog dana)

---

## 🔗 Related Projects

**Mobilna aplikacija:** `/home/user/workspace/`
- React Native 0.76.7
- Expo SDK 53
- Port: 8081
- API Client: `src/api/web-admin-sync.ts`

---

## 📞 Support

Ako imate problema:

1. Proverite `pm2 logs lafantana-whs-admin`
2. Pogledajte `QUICK_FIX_PORT_CONFLICT.md`
3. Pogledajte `DEPLOY_TO_SERVER.md`
4. Pošaljite output komandi:
   ```bash
   pm2 list
   lsof -i :3002
   curl http://localhost:3002/api/health
   ```

---

**Autor:** LaFantana WHS Team
**Licenca:** MIT
**Datum razdvajanja projekata:** 11. Novembar 2025
**Razlog:** Port konflikti i lakši deployment

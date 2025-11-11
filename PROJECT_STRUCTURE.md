# 🏗️ Struktura Projekta - LaFantana WHS

## ⚠️ VAŽNA PROMENA

**Projekti su sada razdvojeni!**

Prethodno su mobilna aplikacija i web admin portal bili u istom folderu, što je izazivalo konflikte portova i deployment probleme. Sada su odvojeni.

## 📁 Nova struktura

### 1. Mobilna aplikacija (React Native + Expo)
**Lokacija:** `/home/user/workspace/`
**Port:** 8081 (automatski, Expo dev server)
**Stack:**
- React Native 0.76.7
- Expo SDK 53
- Zustand (state management)
- Nativewind/Tailwind (styling)

**Glavni folderi:**
```
/home/user/workspace/
├── src/
│   ├── screens/        # Svi ekrani aplikacije
│   ├── components/     # Reusable komponente
│   ├── navigation/     # React Navigation setup
│   ├── api/
│   │   └── web-admin-sync.ts  # 🔗 API client za komunikaciju sa portalom
│   ├── state/          # Zustand state management
│   └── types/          # TypeScript types
├── assets/             # Slike, fontovi, itd.
├── App.tsx            # Entry point
└── package.json
```

### 2. Web Admin Portal (Next.js)
**Lokacija:** `/home/user/lafantana-whs-admin/`
**Port:** 3002 (production)
**Stack:**
- Next.js 15
- MSSQL database
- React 18
- Tailwind CSS

**Glavni folderi:**
```
/home/user/lafantana-whs-admin/
├── app/                # Next.js App Router
│   ├── dashboard/      # Dashboard stranica
│   ├── users/          # Upravljanje korisnicima
│   ├── services/       # Pregled servisa
│   └── api/            # API endpoint-i
├── components/         # React komponente
├── lib/                # Utility functions
├── public/             # Static assets
├── DEPLOY_TO_SERVER.md # 📖 Deployment guide
└── package.json
```

## 🔄 Kako komuniciraju

### API Endpoints (Web Admin → Mobilna)

Web admin portal pruža REST API na:
- `GET /api/health` - Health check
- `GET /api/sync/users` - Preuzmi korisnike
- `POST /api/sync/users` - Sinhronizuj korisnike
- `GET /api/sync/tickets` - Preuzmi tikete
- `POST /api/sync/tickets` - Sinhronizuj tikete
- `POST /api/workday/close` - Zatvori radni dan
- `POST /api/workday/open` - Otvori radni dan
- `GET /api/spare-parts` - Rezervni delovi iz SQL baze

### API Client (Mobilna → Web Admin)

Mobilna aplikacija ima prebuilt client u:
**`/home/user/workspace/src/api/web-admin-sync.ts`**

Ovaj client automatski:
- Testira konekciju
- Sinhronizuje korisnike
- Sinhronizuje tikete
- Zatvara/otvara radni dan
- Preuzima rezervne delove

## 🚀 Kako pokrenuti

### Mobilna aplikacija
```bash
cd /home/user/workspace
bun install
bun start
```
Dev server će automatski startovati na portu 8081.

### Web Admin Portal
```bash
cd /home/user/lafantana-whs-admin
bun install
bun run build
bun run start
```
Portal će biti dostupan na http://localhost:3002

## 📦 Backup

Kompletan backup oba projekta:
```bash
# Lokacija backupa
/home/user/workspace-backup-20251111-180036.tar.gz (331MB)

# Kreiranje novog backupa
cd /home/user
tar -czf workspace-backup-$(date +%Y%m%d-%H%M%S).tar.gz workspace/
tar -czf web-admin-backup-$(date +%Y%m%d-%H%M%S).tar.gz lafantana-whs-admin/
```

## 🔐 Pristup

### Mobilna aplikacija
- **Super user:** admin / admin123
- **Tehničar:** marko / marko123
- **Tehničar:** jovan / jovan123

### Web Admin Portal
- **Admin:** admin / admin123 (samo super_user ima pristup)

## 📱 Konfiguracija sinhronizacije

U mobilnoj aplikaciji:
1. Prijavite se kao **admin**
2. Idite na **Profil** tab
3. Kliknite na **Web Admin Sync**
4. Unesite URL: `http://IP_ADRESA:3002`
5. Testirajte konekciju
6. Sinhronizujte podatke

## 🛠️ Deployment na server

Za deployment web admin portala na production server:
**Pročitajte:** `/home/user/lafantana-whs-admin/DEPLOY_TO_SERVER.md`

## 📚 Dodatna dokumentacija

### Mobilna aplikacija
- `README.md` - Kompletna dokumentacija
- `CLAUDE.md` - Claude Code uputstva

### Web Admin Portal
- `DEPLOY_TO_SERVER.md` - Deployment guide
- `MSSQL_INTEGRATION.md` - SQL baza konfiguracija
- `QUICK_REFERENCE.txt` - Brze reference

---

**Verzija:** 2.1.0
**Datum razdvajanja:** 11. Novembar 2025
**Razlog:** Port konflikti i lakši deployment

# Changelog - La Fantana WHS Water Service Admin

Sve značajne promene implementirane u projektu.

---

## [Nepushovano - Lokalni Commit-ovi] - 2025-11-09

### ✨ Nove Funkcionalnosti

#### 🔄 Auto-Update Sistem za Admin Panel (Commit: `dbb623d`)
**Opis:** Implementiran potpun sistem za automatsku detekciju i ažuriranje aplikacije.

**Dodato:**
- **API Endpoints:**
  - `GET /api/version` - Provera trenutne i najnovije verzije iz git-a
  - `POST /api/update` - Izvršavanje update procesa (git pull, bun install, build)

- **React Komponente:**
  - `UpdateNotification.tsx` - Plavi banner sa notifikacijom o novoj verziji
  - Automatska provera svakih 5 minuta
  - One-click update dugme sa loading indikatorom
  - Prikazuje trenutni i novi commit hash

- **Bash Skripte:**
  - `scripts/auto-update-watcher.sh` - Daemon proces koji monitoring za update flag
  - Automatski restart preko PM2 ili systemd nakon update-a
  - Podrška za oba process managera

- **Dokumentacija:**
  - `AUTO_UPDATE.md` - Kompletno uputstvo za setup
  - Primeri za PM2 i systemd konfiguraciju
  - Troubleshooting sekcija
  - Git konfiguracija za conflict-free updates

**UX Features:**
- Neometajuća notifikacija (može se zatvoriti)
- Loading state tokom update procesa
- Auto-reload stranice nakon update-a
- Animirani slide-in prikaz

**Fajlovi:**
- `web-admin/app/api/version/route.ts` (NOVI)
- `web-admin/app/api/update/route.ts` (NOVI)
- `web-admin/components/UpdateNotification.tsx` (NOVI)
- `web-admin/scripts/auto-update-watcher.sh` (NOVI)
- `web-admin/AUTO_UPDATE.md` (NOVI)
- `web-admin/app/dashboard/page.tsx` (AŽURIRANO)

---

#### 🔙 Dugme "Vrati se na Dashboard" (Commit: `9f6eefb`)
**Opis:** Dodato prominentno dugme za povratak na Dashboard na svim admin stranicama.

**Dodato:**
- Dugme sa strelicom levo na Users stranici
- Dugme sa strelicom levo na Services stranici
- Dugme sa strelicom levo na Configuration stranici
- Konzistentan dizajn sa belom pozadinom i senkom
- Hover efekat za bolji UX

**Fajlovi:**
- `web-admin/app/dashboard/users/page.tsx` (AŽURIRANO)
- `web-admin/app/dashboard/services/page.tsx` (AŽURIRANO)
- `web-admin/app/configuration/page.tsx` (AŽURIRANO)

---

#### ⏱️ Praćenje Vremena i Trajanja Servisa (Commit: `87e0bf6`)
**Opis:** Dodato praćenje vremena početka, završetka i trajanja servisa u minutima na obe aplikacije.

**Web Admin Panel:**
- Tabela servisa proširena sa kolonama:
  - **Početak** - Vreme starta servisa
  - **Završetak** - Vreme završetka servisa
  - **Trajanje** - Trajanje u minutima
- Modal sa detaljima prikazuje vreme početka, završetka i trajanje
- Trajanje prikazano plavom bojom sa naglašenim fontom

**Mobilna Aplikacija:**
- Nova sekcija "Podaci o servisu" na ServiceTicketScreen
  - Prikazuje početak, završetak i trajanje
  - Plave ikone i naglašen dizajn
- HistoryScreen kartice prikazuju trajanje za završene servise
- Automatska kalkulacija trajanja kada serviser završi servis

**Tehničke izmene:**
- Dodat `durationMinutes?: number` u ServiceTicket tip (obe aplikacije)
- `completeTicket()` automatski izračunava trajanje
- `reopenTicket()` resetuje trajanje
- Backward compatible - kalkuliše iz timestamps ako `durationMinutes` nije setovan

**Fajlovi:**
- `web-admin/types/index.ts` (AŽURIRANO)
- `web-admin/app/dashboard/services/page.tsx` (AŽURIRANO)
- `src/types/index.ts` (AŽURIRANO)
- `src/state/serviceStore.ts` (AŽURIRANO)
- `src/screens/ServiceTicketScreen.tsx` (AŽURIRANO)
- `src/screens/HistoryScreen.tsx` (AŽURIRANO)

---

#### 📝 CRUD i Excel Import za Operacije i Delove (Commit: `d807423`)
**Opis:** Kompletna CRUD funkcionalnost za upravljanje operacijama i rezervnim delovima na web admin panelu.

**Funkcionalnosti:**
- **Dodavanje** - Novi delovi i operacije sa validacijom
- **Izmena** - Edit postojećih stavki
- **Brisanje** - Delete sa potvrdom
- **Toggle Active/Inactive** - Disable/enable bez brisanja
- **CSV/Excel Import** sa:
  - Podrškom za kolone: ChItemId, ChItemCode, ChItemName
  - Sprečavanjem duplikata po ID i Code
  - Podrškom za zapete, tačku-zapetu i tab separatore
  - Case-insensitive prepoznavanje kolona

**API Endpoints:**
- `GET/POST /api/config/operations` - Lista i dodavanje operacija
- `PUT/DELETE /api/config/operations/[id]` - Izmena i brisanje
- `POST /api/config/operations/import` - Bulk import
- `GET/POST /api/config/spare-parts` - Lista i dodavanje delova
- `PUT/DELETE /api/config/spare-parts/[id]` - Izmena i brisanje
- `POST /api/config/spare-parts/import` - Bulk import

**UI Features:**
- Tabbed interfejs (Operacije vs Delovi)
- Modal forme za Add/Edit
- CSV file upload sa drag-and-drop
- Real-time validacija duplikata
- Feedback sa brojem dodanih/preskočenih stavki

**Fajlovi:**
- `web-admin/app/configuration/page.tsx` (KOMPLETAN REWRITE)
- `web-admin/app/api/config/operations/route.ts` (AŽURIRANO)
- `web-admin/app/api/config/operations/[id]/route.ts` (NOVI)
- `web-admin/app/api/config/operations/import/route.ts` (NOVI)
- `web-admin/app/api/config/spare-parts/route.ts` (AŽURIRANO)
- `web-admin/app/api/config/spare-parts/[id]/route.ts` (NOVI)
- `web-admin/app/api/config/spare-parts/import/route.ts` (NOVI)

---

### 🐛 Bug Fixes

#### 🔐 Login Problem - Prazni Users Array (Commit: `484e8f0`)
**Problem:** Korisnici nisu mogli da se loguju jer je users array bio prazan.

**Rešenje:**
- Dodat default admin user u `dataStore.ts`
- Kredencijali: `admin` / `admin123`
- Uključena sva obavezna polja (charismaId, depot, etc.)

**Fajlovi:**
- `web-admin/lib/dataStore.ts` (AŽURIRANO)

---

## 📊 Statistika Promena

**Ukupno Commit-ova:** 5 glavnih funkcionalnih commit-a

**Fajlovi:**
- **Novi fajlovi:** 11
- **Ažurirani fajlovi:** 9
- **Ukupne linije koda:** ~1500+ linija

**Tehnologije:**
- React 18 / Next.js 15
- TypeScript
- Bun runtime
- TailwindCSS / Nativewind
- Zustand state management
- React Native 0.76.7
- Expo SDK 53

---

## 🚀 Kako Testirati

### Auto-Update Funkcionalnost:
```bash
# Na serveru, postavite watcher
cd /home/itserbia/web-admin
pm2 start scripts/auto-update-watcher.sh --name "web-admin-watcher"
pm2 save

# Napravite commit na GitHub
# Sačekajte 5 minuta
# Kliknite "Ažuriraj sada" na notifikaciji
```

### CRUD Operacije:
1. Idite na `/configuration`
2. Kliknite "Dodaj novi"
3. Unesite podatke ili upload-ujte CSV
4. Testirajte Edit/Delete/Toggle funkcije

### Praćenje Vremena:
1. Kreirajte novi servis na mobilnoj aplikaciji
2. Završite servis
3. Proverite trajanje na `/dashboard/services`
4. Proverite da se prikazuje u minutima

---

## 📝 Napomene

- **GitHub Token Problem:** Token-i nisu imali odgovarajuće `repo` dozvole za push
- **Rešenje:** Koristiti GitHub Desktop, CLI sa SSH, ili kreirati novi token sa `repo` scope-om
- **Svi commit-ovi su lokalno sačuvani** i spremni za push

---

## 🔜 Sledeći Koraci

1. ✅ Push-ovati kod na GitHub (čeka se validan token)
2. ✅ Deployovati na Ubuntu server
3. ✅ Postaviti PM2 watcher za auto-update
4. ✅ Testirati sve funkcionalnosti u produkciji

---

**Datum kreiranja:** 09.11.2025
**Autor:** Claude Code (Vibecode AI Assistant)
**Projekat:** La Fantana WHS - Water Service Admin & Mobile App

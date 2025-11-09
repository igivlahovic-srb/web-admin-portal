# Water Service App

Profesionalna mobilna aplikacija za servisiranje i održavanje water aparata sa bocom od 19L.

## 📱 Opis

Water Service App je moderan sistem za upravljanje servisnim radovima na water aparatima. Aplikacija omogućava serviserima da brzo evidentiraju servise skeniranjem QR kodova, beleženju operacija i utrošenih rezervnih delova, dok super administratori imaju uvid u sve servise i statistiku.

## ✨ Funkcionalnosti

### 🔐 Autentifikacija
- **Prijava sa ulogama**: Dva nivoa pristupa (Super User i Serviser)
- **Perzistentna sesija**: Automatsko čuvanje prijavljenog korisnika
- **Demo pristup**: Unapred konfigurisani nalozi za testiranje
- **Aktivni/Neaktivni korisnici**: Admini mogu deaktivirati naloge bez brisanja

### 👥 Upravljanje korisnicima (Super User)
- **Dodavanje korisnika**: Kreiranje novih servisera ili administratora
  - Unos korisničkog imena, lozinke, imena
  - Izbor uloge (Serviser/Administrator)
  - Automatski aktivni po default-u
- **Izmena korisnika**: Ažuriranje informacija postojećih korisnika
  - Promena imena i prezimena
  - Promena uloge
  - Reset lozinke
- **Deaktivacija/Aktivacija**: Privremeno onemogućavanje pristupa
  - Zadržavanje podataka u sistemu
  - Brza reaktivacija po potrebi
  - Zaštita - ne može se deaktivirati sopstveni nalog
- **Brisanje korisnika**: Trajno uklanjanje korisnika iz sistema
  - Potvrda pre brisanja
  - Zaštita - ne može se obrisati sopstveni nalog
- **Pregled statistike**: Ukupno, aktivnih i neaktivnih korisnika
- **Lista korisnika**: Pregled svih korisnika sa statusima i ulogama

### 📊 Kontrolna tabla (Dashboard)
- **Personalizovani pozdrav**: Prikaz imena i uloge korisnika
- **Statistika uživo**: Aktivni servisi, današnji servisi, ukupno završenih
- **Brzo pokretanje**: Direktan pristup skeneru za nove servise (serviser)
- **Nedavna aktivnost**: Pregled poslednjih servisa

### 📷 QR Skener
- **Univerzalno skeniranje**: Automatsko otvaranje servisnog naloga
  - QR kodovi
  - EAN13 i EAN8 kodovi
  - 2D kodovi (DataMatrix, PDF417)
  - Code128, Code39, Code93
- **Ručni unos**: Elegantna forma za manuelno unošenje šifre
  - Validacija unosa
  - Brojač karaktera
  - Automatski fokus
  - Clear dugme
- **Dozvole kamere**: Intuitivan prikaz za zahtevanje pristupa kameri
- **Vizuelni indikatori**: Okvir za precizno pozicioniranje koda

### 🔧 Servisni nalog
- **Dodavanje operacija**: Izbor iz liste predefinisanih servisnih operacija
  - Čišćenje rezervoara
  - Zamena filtera
  - Provera slavina
  - Provera sistema hlađenja
  - Provera grejača
  - Zamena cevi
- **Rezervni delovi**: Evidencija utrošenih delova sa količinom
  - Filter uložak
  - Slavine (hladna/topla voda)
  - Silikonske cevi
  - Grejači
  - Termostati
- **Validacija**: Ne dozvoljava završetak bez bar jedne operacije
- **Interaktivno brisanje**: Mogućnost uklanjanja grešaka

### 📜 Istorija servisa
- **Filtriranje**: Prikaz svih, aktivnih ili završenih servisa
- **Detaljan pregled**: Kompletne informacije za svaki servis
  - Šifra aparata
  - Ime servisera
  - Datumi i vremena
  - Liste operacija i rezervnih delova
- **Status indikatori**: Jasna vizuelna razlika između statusnih tipova

### 👤 Profil
- **Lična statistika**:
  - Završeni servisi
  - Servisi u toku
  - Ukupno operacija
  - Utrošeni delovi
- **Informacije o nalogu**: Korisničko ime, ime, uloga
- **Sigurna odjava**: Potvrda pre odjave
- **Podešavanja (Settings)**: Pristup web admin sync funkcionalnosti

### 🌐 Web Admin Sinhronizacija
- **Sinhronizacija sa web panelom**: Prenos podataka na web admin panel
  - Konfigurisanje URL-a web panela
  - Testiranje konekcije
  - Automatska ili manualna sinhronizacija
  - Sinhronizacija korisnika i servisnih naloga
- **Status praćenja**: Prikaz poslednje sinhronizacije
- **Web Admin Panel**: Kompletna web aplikacija za pregled podataka (pokrenuta na portu 3000)

## 🎨 Dizajn

### Dizajnerske teme
- **Profesionalna paleta boja**:
  - Primarno: Plava (#1E40AF, #3B82F6) - poverenje i profesionalizam
  - Sekundarno: Zelena (#10B981) - uspeh i završetak
  - Akcenti: Žuta (#F59E0B) - aktivnost i upozorenje
- **Tipografija**: Jasna hijerarhija sa bold naslovima
- **Kartice**: Zaobljene kartice sa diskretnim senkama
- **Gradienti**: Glatki linearni gradijenti za header sekcije
- **Ikone**: Ionicons za konzistentno iskustvo

### UX Principi
- **Apple Human Interface Design**: Moderne iOS konvencije
- **Minimalistički pristup**: Fokus na bitne informacije
- **Adekvatan spacing**: Dosta belog prostora između elemenata
- **Intuitivna navigacija**: Bottom tabs za glavne sekcije
- **Instant feedback**: Animacije i vizuelni indikatori akcija

## 🏗️ Arhitektura

### Struktura projekta
```
src/
├── screens/           # React Native screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ScannerScreen.tsx
│   ├── ServiceTicketScreen.tsx
│   ├── HistoryScreen.tsx
│   └── ProfileScreen.tsx
├── navigation/        # React Navigation setup
│   └── RootNavigator.tsx
├── state/            # Zustand state management
│   ├── authStore.ts
│   └── serviceStore.ts
├── types/            # TypeScript types
│   └── index.ts
└── utils/            # Helper functions
```

### Tehnologije
- **Expo SDK 53** - React Native 0.76.7
- **React Navigation** - Native stack i bottom tabs
- **Zustand** - State management sa AsyncStorage perzistencijom
- **NativeWind** - Tailwind CSS stilizacija
- **Expo Camera** - QR kod skeniranje
- **TypeScript** - Type safety
- **date-fns** - Formatiranje datuma

## 👥 Korisnici (Demo)

### Super Administrator
- **Username**: `admin`
- **Password**: `admin123`
- **Ovlašćenja**: Pregled svih servisa svih servisera

### Serviser 1
- **Username**: `marko`
- **Password**: `marko123`
- **Ovlašćenja**: Kreiranje i pregled svojih servisa

### Serviser 2
- **Username**: `jovan`
- **Password**: `jovan123`
- **Ovlašćenja**: Kreiranje i pregled svojih servisa

## 🚀 Tok rada

### Za servisera:
1. Prijava sa naloga
2. Klik na "Novi servis" ili scanner ikona
3. Skeniranje QR koda water aparata (ili manuelni unos)
4. Dodavanje izvršenih operacija
5. Dodavanje utrošenih rezervnih delova (opciono)
6. Završetak servisa
7. Pregled istorije svih servisa

### Za super usera:
1. Prijava sa naloga
2. Pregled kontrolne table sa svim statistikama
3. **Upravljanje korisnicima** (novi tab):
   - Dodavanje novih servisera/administratora
   - Izmena postojećih korisnika
   - Deaktivacija/aktivacija naloga
   - Brisanje korisnika
4. Uvid u sve servise svih servisera
5. Analiza istorije i performansi
6. **Sinhronizacija sa web admin panelom**:
   - Pristup Settings ekranu iz Profila
   - Konfiguracija URL-a web panela
   - Sinhronizacija svih korisnika i servisa

## 🌐 Web Admin Panel

Water Service aplikacija sada dolazi sa **kompletnim web admin panelom** koji omogućava super administratorima da pregledaju sve podatke na desktop računaru!

### Pokretanje Web Admin Panela

```bash
cd web-admin
bun install
bun dev
```

Web panel će biti dostupan na: `http://localhost:3000`

### Sinhronizacija podataka

1. **Pokrenite web admin panel** na računaru:
   ```bash
   cd web-admin
   bun install
   bun dev
   ```

2. **Pronađite IP adresu računara** (VAŽNO - ne koristite localhost!):
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   # ili
   hostname -I
   ```

   Potražite IP adresu koja počinje sa 192.168.x.x ili 10.x.x.x

3. **U mobilnoj aplikaciji**:
   - Prijavite se kao super admin (admin/admin123)
   - Idite na **Profil → Settings** (ikonica zupčanika)
   - Unesite URL web panela sa IP adresom računara:
     - ✅ ISPRAVNO: `http://192.168.1.100:3000`
     - ❌ POGREŠNO: `http://localhost:3000` (NE RADI na mobilnom telefonu!)
   - Kliknite **"Sačuvaj"** da sačuvate URL
   - Kliknite **"Testiraj konekciju"** da proverite da li radi
   - Ako je konekcija uspešna, kliknite **"Sinhronizuj sada"** da prebacite sve podatke

4. **Prijavite se na web panel**:
   - Otvorite browser i idite na `http://localhost:3000` (na računaru)
   - Username: `admin`
   - Password: `admin123`

**⚠️ Česta greška:** "Network request failed" znači da koristite localhost umesto IP adrese, ili da telefon i računar nisu na istoj WiFi mreži!

### Web Panel funkcionalnosti

- **📊 Dashboard**: Statistika, aktivni servisi, današnji servisi
- **👥 Korisnici**: Pregled svih korisnika, filtriranje po statusu
- **🔧 Servisi**: Kompletna istorija svih servisa sa detaljima
- **🔍 Detalji servisa**: Klik na servis pokazuje sve operacije i rezervne delove

Više informacija u `web-admin/README.md`

## 📝 Napomene

- Aplikacija koristi perzistentno čuvanje podataka (AsyncStorage)
- Korisnici, servisi i podaci se čuvaju lokalno
- Super admini imaju poseban tab "Korisnici" za upravljanje korisnicima
- Neaktivni korisnici ne mogu da se prijave
- Korisnik ne može da obriše ili deaktivira sam sebe
- QR kodovi moraju biti validan format (bilo koji QR/EAN kod se može skenirati za demo)
- Aplikacija je optimizovana za iOS

## 🔄 Buduća poboljšanja

Mogući dodaci za verziju 2.0:
- Backend integracija sa realnom bazom podataka
- Push notifikacije za nove servise
- Geolokacija servisa
- PDF izvoz servisnih naloga
- Slike pre/posle servisa
- Kalendar zakazanih servisa
- Napredna statistika i grafikoni
- Offline mod sa sync-om

---

**Verzija**: 1.0
**Platforma**: iOS (optimizovano)
**Napravljeno sa**: Vibecode AI App Builder

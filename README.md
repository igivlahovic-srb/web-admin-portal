# La Fantana WHS - Servisni Modul

Profesionalna mobilna aplikacija za servisiranje i održavanje water aparata sa bocom od 19L.

**Poslednje ažurirano**: 2025-01-XX (Verzija 2.1.0)

---

## 🌐 Web Admin Portal

**Web admin portal je sada dostupan!** Upravljajte korisnicima i servisima profesionalno preko web browser-a.

### 🚀 Quick Deploy na Ubuntu Server

**Automatski deployment script je sada dostupan!** Jedan script instalira sve (Node.js, Bun, PM2, Nginx, web portal).

#### **Metod 1: Automatski Script (Preporučeno)** ⚡

```bash
# 1. Prebacite script na server
scp DEPLOY_WEB_PORTAL_UBUNTU.sh root@YOUR_SERVER_IP:/root/

# 2. Konektujte se i pokrenite
ssh root@YOUR_SERVER_IP
chmod +x DEPLOY_WEB_PORTAL_UBUNTU.sh
sudo bash DEPLOY_WEB_PORTAL_UBUNTU.sh
```

**Gotovo!** Script automatski povlači kod sa GitHub-a i konfiguriše sve.

#### **Metod 2: Direktan Download**

```bash
ssh root@YOUR_SERVER_IP
wget https://raw.githubusercontent.com/igivlahovic-srb/web-admin-portal/main/DEPLOY_WEB_PORTAL_UBUNTU.sh
chmod +x DEPLOY_WEB_PORTAL_UBUNTU.sh
sudo bash DEPLOY_WEB_PORTAL_UBUNTU.sh
```

**Portal dostupan na:** `http://YOUR_SERVER_IP`

**Login:** `admin` / `admin123`

**Funkcionalnosti:**
- ✅ Dashboard sa statistikama uživo
- ✅ Upravljanje korisnicima
- ✅ Istorija servisa
- ✅ Radni dani (workday management)
- ✅ Nginx reverse proxy sa SSL
- ✅ PM2 auto-start pri boot-u
- ✅ Mobile app sinhronizacija
- ✅ Automatski pull sa GitHub-a

**📚 Dokumentacija:**
- `DEPLOYMENT_UPUTSTVO.md` - Kompletan deployment guide
- `DEPLOY_WEB_PORTAL_UBUNTU.sh` - Automatski script

**GitHub Repo:** https://github.com/igivlahovic-srb/web-admin-portal

---

## 🎨 Ikone Aplikacije

Aplikacija koristi La Fantana brending sa belim slovima na plavom gradijent pozadini.

### Generisanje ikona

Za generisanje novih ikona sa belim slovima:

1. Otvorite `generate-icons.html` u web browser-u
2. Kliknite "Generiši Ikone" ili "Preuzmi Sve"
3. Sačuvajte generisane ikone u `/assets/` folder:
   - `icon.png` (1024x1024) - Glavna iOS/Android ikona
   - `adaptive-icon.png` (1024x1024) - Android adaptive ikona
   - `favicon.png` (48x48) - Web favicon
4. Ikone će imati:
   - **Plavi gradijent pozadinu** (#1E40AF → #3B82F6 → #60A5FA)
   - **Bela slova** "LA FANTANA WHS" sa "SERVISNI MODUL" podnaslovom
   - **Veća i čitljivija tipografija**
5. Detaljnije uputstvo: `ICON_GENERATOR_INSTRUCTIONS.md`

## 🔧 Nedavne Izmene (v2.1.0)

### ✅ Ispravljene Greške
- **Text Rendering Errors**: Ispravljeno svih 5 instanci "Text strings must be rendered within a <Text> component" greške
  - `HistoryScreen.tsx`: Dodato `<Text>` wrapping za "x" i "min" literale (linije 163, 110)
  - `DashboardScreen.tsx`: Dodato `<Text>` wrapping za "operacija" i "delova" (linije 301, 309)
  - `ServiceTicketScreen.tsx`: Refaktorisano prikazivanje trajanja da koristi nested Text (linija 261)
- **Login Screen Logo**: Kompletan redizajn logoa na login ekranu
  - ❌ Uklonjeno: Beli kvadrat pozadina (`bg-white`), shadow efekti, Image komponenta
  - ✅ Dodato: Direktan text prikaz sa čistim belim slovima na transparentnoj pozadini
  - ✅ Uvećan logo: `text-5xl` (60px) za "LA FANTANA", `text-4xl` (48px) za "WHS"
  - ✅ Perfektna vidljivost na plavom gradijent pozadini
- **Ikone**: Ažurirane aplikacione ikone sa belim slovima na plavom gradijent pozadini

### 🆕 Nove Funkcionalnosti
- **🔄 Automatska Sinhronizacija**
  - Automatsko sinhronizovanje servisa i korisnika sa web portalom nakon svake promene
  - Uključi "Automatska sinhronizacija" u Settings ekranu
  - Kada je omogućena, svaka promena (novi servis, završen servis, novi korisnik) se odmah šalje na portal
  - Ne treba više ručno pritisnuti "Sinhronizuj sada" dugme!
- **📅 Upravljanje Radnim Danima** 🌙
  - **Mobilna aplikacija (Profil tab):**
    - Dugme "Zatvori radni dan" za tehničare u tabu Profil
    - Automatska sinhronizacija svih servisa pre zatvaranja
    - Brisanje lokalnih podataka nakon zatvaranja radnog dana
    - Provera da nema aktivnih servisa pre zatvaranja
    - Prikaz statusa radnog dana (otvoren/zatvoren) sa timestamp-om
    - Samo administrator može ponovo otvoriti radni dan sa portala
  - **Web Admin Panel (Radni dani tab):**
    - Pregled svih servisera sa zatvorenim radnim danima
    - Otvaranje radnog dana sa **obaveznim pisanim obrazloženjem** (min. 10 karaktera)
    - Istorija svih otvaranja radnih dana sa razlozima
    - Log zapisa sa timestamp-om, imenom servisera, imenom admina i razlogom
    - Pristup samo za super_user i gospodar uloge
  - **Backend API:**
    - `/api/workday/close` - Endpoint za zatvaranje radnog dana
    - `/api/workday/open` - Endpoint za otvaranje radnog dana (POST) i čitanje log-a (GET)
    - Validacija uloga i obaveznih polja
    - Čuvanje workday statusa u `data/users.json`
    - Čuvanje log-a u `data/workday-log.json`
- **Bidirekciona Sinhronizacija**: Mobilna aplikacija sada preuzima i šalje servise sa/na web portal
  - Servisi otvoreni na portalu se automatski prikazuju u mobilnoj app
  - Inteligentno spajanje - koristi se najnovija verzija svakog servisa
  - `syncFromWeb()` - Preuzimanje servisa sa portala
  - `bidirectionalSync()` - Puna sinhronizacija (preuzimanje + slanje)
  - Detalji: `BIDIRECTIONAL_SYNC_GUIDE.md`
- **🤖 Automatski Android APK Build Sistem** 🚀
  - **AUTOMATSKI build nakon svake promene!** Git post-commit hook
  - Build radi u pozadini - ne blokira tvoj rad
  - Real-time status indikator na web portalu (žuti banner kada je build u toku)
  - Auto-refresh web stranice svaka 30 sekundi tokom build-a
  - Istorija build-ova - prikazuje poslednja 3 build-a sa datumima i veličinama
  - Auto-update provera u mobilnoj aplikaciji
  - Notifikacija korisnicima kada je dostupna nova verzija
  - **Workflow:** Promeniš kod → Commit → Čekaš 5-10min → Refresh portal → Preuzmeš APK! 🎉
  - Detalji: `AUTO_BUILD_GUIDE.md`
- **💾 Backup Sistem** 🗄️
  - **Kompletna arhiva celog projekta!** Mobilna app, web portal, APK fajlovi
  - Novi "Backup" tab u web admin panelu
  - Kreiranje backup-a sa jednim klikom
  - Prikaz poslednja 3 backup-a u tabeli
  - Download linkovi za svaki backup (tar.gz format)
  - Automatsko brisanje starijih backup-ova (čuva samo 3 najnovija)
  - Sadrži: mobilna aplikacija source, web portal source, APK fajlovi, env fajlovi
  - RESTORE_GUIDE.txt uključen u svaki backup
  - Backup proces traje 1-2 minuta
- **Icon Generator Tool**: HTML generator za kreiranje ikona sa custom tipografijom (`generate-icons.html`)
- **Web Admin - Mobilna Aplikacija**: Novi tab u web admin panelu za upravljanje Android APK fajlovima
  - Upload/download Android APK
  - Verzionisanje aplikacije
  - Prikaz poslednja 3 build-a u tabeli
  - Real-time build status sa spinner-om
  - Link za manual download

### 📚 Dokumentacija
- `AUTO_BUILD_GUIDE.md`: **NOVO!** Kompletan guide za automatski build sistem
- `AUTO_UPDATE_ERROR_FIX.md`: **NOVO!** Objašnjenje network error-a u development mode-u
- `BACKUP_SYSTEM_GUIDE.md`: **NOVO!** Kompletan guide za backup i restore sistem
- `EAS_CLOUD_VS_LOCAL_BUILD.md`: **NOVO!** Objašnjenje cloud build vs local build (SDK error fix)
- `QUICK_FIX_SDK_ERROR.md`: **NOVO!** Brzi fix za "SDK location not found" grešku
- `QUICK_FIX_EAS_NOT_CONFIGURED.md`: **NOVO!** Brzi fix za "EAS project not configured" grešku
- `ANDROID_BUILD_GUIDE.md`: Manualni Android APK build guide
- `CREATE_BACKUP.sh`: **NOVO!** Script za kreiranje kompletnog backup-a projekta
- `DEPLOY_BACKUP_SYSTEM.sh`: **NOVO!** Script za deploy backup sistema na server
- `DEPLOY_BUILD_FIX.sh`: **NOVO!** Script za deploy cloud build fix-a na server
- `DEPLOY_EAS_CONFIG_FIX.sh`: **NOVO!** Script za deploy EAS configuration fix-a na server
- `QUICK_START_DOWNLOAD_LINKS.md`: Quick reference za prikaz download linkova
- `BIDIRECTIONAL_SYNC_GUIDE.md`: Detaljno objašnjenje bidirekcione sinhronizacije
- `SYNC_DOCUMENTATION.md`: **NOVO!** Kompletna dokumentacija sinhronizacije sa testovima (100% testova prošlo)
- `ICON_GENERATOR_INSTRUCTIONS.md`: Uputstvo za generisanje ikona
- `LOGIN_LOGO_GUIDE.md`: Uputstvo za login screen logo
- `IOS_REFRESH_GUIDE.md`: Troubleshooting za iOS cache probleme
- `IOS_ANDROID_SYNC.md`: Objašnjenje React Native cross-platform garancije
- `QUICK_REFERENCE.md`: Brza referenca za česte komande
- `refresh-app.sh`: Skripta za čišćenje cache-a
- `BUILD_ANDROID_APK.sh`: Build script za kreiranje Android APK

## 📱 Opis

La Fantana WHS (Water Handling System) je moderan sistem za upravljanje servisnim radovima na water aparatima. Aplikacija omogućava serviserima da brzo evidentiraju servise skeniranjem QR kodova, beleženju operacija i utrošenih rezervnih delova, dok super administratori imaju uvid u sve servise i statistiku.

## ✨ Funkcionalnosti

### 🔐 Autentifikacija
- **Prijava sa ulogama**: Dva nivoa pristupa (Super User i Serviser)
- **Dvofaktorska autentifikacija (2FA)**: Dodatna zaštita naloga
  - Opciona 2FA zaštita za sve korisnike
  - QR kod setup sa authenticator aplikacijama (Google Authenticator, Authy, itd.)
  - 10 backup kodova za pristup bez telefona
  - Mogućnost regenerisanja backup kodova
  - Jednostavno omogućavanje/onemogućavanje kroz Profil
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
- **Dodavanje operacija**: Izbor iz dropdown liste sa filterima
  - Pretraga po šifri operacije (ItemCode) ili nazivu (ItemName)
  - Operacije se konfigurišu na web admin panelu
  - Automatska sinhronizacija sa mobilnom aplikacijom
  - Prikazuju se samo aktivne operacije
  - Svaka operacija ima: ItemId, ItemCode, ItemName
- **Rezervni delovi**: Izbor iz dropdown liste sa filterima
  - Pretraga po šifri dela (ItemCode) ili nazivu (ItemName)
  - Rezervni delovi se konfigurišu na web admin panelu
  - Automatsko preuzimanje sa servera
  - Prikazuju se samo aktivni delovi
  - Svaki deo ima: ItemId, ItemCode, ItemName, jedinicu mere
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
- **Dvofaktorska autentifikacija (2FA)**:
  - Omogućavanje/onemogućavanje 2FA zaštite
  - Pregled preostalih backup kodova
  - Regenerisanje novih backup kodova
  - QR kod setup sa authenticator aplikacijama
- **Informacije o nalogu**: Korisničko ime, ime, uloga
- **Brza sinhronizacija**: Direktno dugme za sinhronizaciju podataka (dostupno svima)
- **Zatvori radni dan**: Dugme za zatvaranje radnog dana (samo tehničari)
  - Automatska sinhronizacija svih servisa pre zatvaranja
  - Provera da nema aktivnih servisa
  - Brisanje lokalnih podataka nakon zatvaranja
  - Prikaz statusa radnog dana (otvoren/zatvoren)
- **Podešavanja (Settings)**: Pristup web admin sync funkcionalnosti (samo super admin)
- **Sigurna odjava**: Potvrda pre odjave

### 🌐 Web Admin Sinhronizacija
- **Brza sinhronizacija** (dostupna svim korisnicima):
  - Jednostavno dugme "Sinhronizuj podatke" na Profile ekranu
  - Serviseri mogu sinhronizovati svoje servise
  - Super admini sinhronizuju sve korisnike i servise
  - Automatska provera konekcije pre sinhronizacije
- **Napredna podešavanja** (samo super admin):
  - Konfigurisanje URL-a web panela
  - Testiranje konekcije
  - Automatska ili manualna sinhronizacija
  - Status praćenja i poslednja sinhronizacija
- **Web Admin Panel**: Kompletna web aplikacija za pregled podataka (pokrenuta na portu 3000)

## 🎨 Dizajn

### Dizajnerske teme
- **Brending**: La Fantana logo i ikone uniformne sa web admin panelom
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
│   ├── ProfileScreen.tsx
│   ├── TwoFactorSetupScreen.tsx
│   └── TwoFactorVerifyScreen.tsx
├── navigation/        # React Navigation setup
│   └── RootNavigator.tsx
├── state/            # Zustand state management
│   ├── authStore.ts
│   ├── serviceStore.ts
│   ├── syncStore.ts
│   ├── configStore.ts
│   └── twoFactorStore.ts
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
- **Expo Crypto** - 2FA TOTP generisanje i verifikacija
- **react-native-qrcode-svg** - QR kod generisanje za 2FA setup
- **TypeScript** - Type safety
- **date-fns** - Formatiranje datuma

### Razvoj i Testiranje

Aplikacija je optimizovana za **iOS i Android** platforme.

**Pokretanje:**
```bash
bun start
```

**Reload aplikacije:**
- **iOS**: Shake device ili `Cmd + D` (simulator), zatim "Reload"
- **Android**: Shake device ili `Cmd + M`, zatim "Reload"
- **Metro bundler**: Pritisnite `r` za reload ili `shift+r` za reload sa clear cache

**Ako iOS/Android ne prikazuje najnovije promene:**
```bash
# Očistite cache i restartujte
bun start --clear
# ili
rm -rf .expo && bun start
```

Detaljnije informacije: `IOS_REFRESH_GUIDE.md`

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
2. (Opciono) Unos 2FA koda ako je omogućeno
3. Klik na "Novi servis" ili scanner ikona
4. Skeniranje QR koda water aparata (ili manuelni unos)
5. Dodavanje izvršenih operacija
6. Dodavanje utrošenih rezervnih delova (opciono)
7. Završetak servisa
8. Pregled istorije svih servisa
9. **Sinhronizacija podataka**: Profil → "Sinhronizuj podatke" dugme
10. **Zatvaranje radnog dana**: Profil → "Zatvori radni dan" dugme (nakon završetka svih servisa)

### Za super usera:
1. Prijava sa naloga
2. (Opciono) Unos 2FA koda ako je omogućeno
3. Pregled kontrolne table sa svim statistikama
4. **Upravljanje korisnicima** (novi tab):
   - Dodavanje novih servisera/administratora
   - Izmena postojećih korisnika
   - Deaktivacija/aktivacija naloga
   - Brisanje korisnika
5. Uvid u sve servise svih servisera
6. Analiza istorije i performansi
7. **Sinhronizacija sa web admin panelom**:
   - Pristup Settings ekranu iz Profila
   - Konfiguracija URL-a web panela
   - Sinhronizacija svih korisnika i servisa
8. **Upravljanje radnim danima** (na web portalu):
   - Pregled servisera sa zatvorenim radnim danima
   - Otvaranje radnog dana sa pisanim obrazloženjem
   - Pregled istorije otvaranja radnih dana

### Podešavanje 2FA (svi korisnici):
1. Prijavite se na aplikaciju
2. Idite na **Profil** tab
3. Kliknite na karticu **"Dvofaktorska autentifikacija"**
4. Kliknite **"Omogući 2FA"**
5. Skenirajte QR kod sa authenticator aplikacijom (Google Authenticator, Authy, Microsoft Authenticator, itd.)
6. Unesite 6-cifreni kod za potvrdu
7. **VAŽNO**: Sačuvajte 10 backup kodova na sigurnom mestu
8. Od sledećeg logovanja, unosićete 2FA kod nakon lozinke

## 🌐 Web Admin Panel

Water Service aplikacija sada dolazi sa **kompletnim web admin panelom** koji omogućava super administratorima da pregledaju sve podatke na desktop računaru!

### Pokretanje Web Admin Panela

#### Na lokalnom računaru (Development):
```bash
cd web-admin
bun install
bun dev
```
Web panel će biti dostupan na: `http://localhost:3000`

#### Na Ubuntu 22.04 serveru (Production):
```bash
# Prebaci web-admin folder na server
scp -r web-admin/ user@server-ip:/home/user/

# SSH na server i pokreni instalacioni script
ssh user@server-ip
cd ~/web-admin
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

**Detaljne instalacione uputstva:**
- 📖 `web-admin/UBUNTU_INSTALL.md` - Potpuna korak-po-korak dokumentacija
- ⚡ `web-admin/QUICK_START.md` - Brza instalacija za iskusne korisnike

Instalacioni script automatski instalira Node.js, Bun, sve pakete, pravi build, konfiguriše firewall i opciono instalira PM2 i Nginx.

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
- **📅 Radni dani**: Upravljanje radnim danima servisera (samo admin)
  - Pregled servisera sa zatvorenim radnim danima
  - Otvaranje radnog dana sa obaveznim obrazloženjem (min. 10 karaktera)
  - Istorija svih otvaranja radnih dana sa timestamp-om, imenom servisera, admina i razlogom
  - Validacija uloga - pristup samo za super_user i gospodar
- **⚙️ Konfiguracija**:
  - **Operacije tabela** sa kolonama: ItemId, ItemCode, ItemName, Opis, Status
  - **Rezervni delovi tabela** sa kolonama: ItemId, ItemCode, ItemName, Jedinica, Status
  - Upravljanje operacijama (dodavanje, izmena, deaktivacija)
  - Upravljanje rezervnim delovima (dodavanje, izmena, deaktivacija)
  - Sinhronizacija sa mobilnom aplikacijom (Web → Mobile only)
- **📱 Mobilna aplikacija**:
  - Prikaz trenutne verzije Android aplikacije
  - Upload novih APK fajlova
  - Download link za servisere da preuzmu aplikaciju
  - Automatsko prepoznavanje verzije iz imena fajla
  - Jednostavno ažuriranje aplikacije za sve servisere
- **💾 Backup**:
  - Kreiranje kompletnog backup-a projekta (mobilna app, web portal, APK)
  - Prikaz poslednja 3 backup-a sa verzijama, datumima i veličinama
  - Download linkovi za svaki backup u tar.gz formatu
  - Automatsko čuvanje samo 3 najnovija backup-a
  - Backup proces traje 1-2 minuta
  - Sadrži RESTORE_GUIDE.txt sa detaljnim uputstvima

### Upravljanje Android aplikacijom

**🚀 Automatski Build Sistem (v2.1.0):**

Super administratori mogu buildovati i uploadovati nove verzije Android aplikacije direktno na Ubuntu serveru:

#### Build APK na serveru:
```bash
cd ~/webadminportal
./BUILD_ANDROID_APK.sh
```

Build script automatski:
1. Čita verziju iz `app.json` (npr. 2.1.0)
2. Build-uje Android APK sa EAS Build
3. Kopira APK u `web-admin/public/apk/lafantana-vX.X.X.apk`
4. Postavlja permissions za download
5. **Automatski čuva samo poslednja 3 build-a** (briše starije)

**Za detaljno uputstvo za build:** `ANDROID_BUILD_GUIDE.md`

#### Auto-Update sistem:

**Mobilna aplikacija automatski:**
- ✅ Proverava za nove verzije pri pokretanju
- ✅ Poredi trenutnu verziju sa verzijom na portalu
- ✅ Prikazuje dialog ako postoji novija verzija
- ✅ Otvara download link kada korisnik klikne "Preuzmi"

**Serviseri:**
1. Otvaraju aplikaciju → automatski dobijaju notifikaciju ako ima nova verzija
2. Kliknu "Preuzmi" → download počinje
3. Instaliraju APK → stara verzija se automatski zamenjuje
4. Svi podaci ostaju sačuvani

#### Manuelni upload (opciono):

Super administratori mogu i manualno uploadovati APK kroz web panel:

1. Idite na tab **"Mobilna aplikacija"** u web admin panelu
2. Kliknite na upload dugme i izaberite APK fajl
3. Preporučeni format imena: `lafantana-v2.1.0.apk` (verzija će biti automatski detektovana)
4. Nakon upload-a, serviseri mogu preuzeti novu verziju direktno sa web panela

**Napomena za servisere:**
- Android uređaji moraju dozvoliti instalaciju iz nepoznatih izvora
- Nakon preuzimanja APK fajla, otvorite ga i pratite uputstva za instalaciju
- Ako već imate instaliranu aplikaciju, nova verzija će je zameniti
- Svi podaci ostaju sačuvani nakon ažuriranja

Više informacija u `web-admin/README.md`

## 📝 Napomene

- Aplikacija koristi perzistentno čuvanje podataka (AsyncStorage)
- Korisnici, servisi i podaci se čuvaju lokalno
- **2FA podaci (tajni ključevi i backup kodovi) se čuvaju lokalno na uređaju**
- Super admini imaju poseban tab "Korisnici" za upravljanje korisnicima
- Neaktivni korisnici ne mogu da se prijave
- Korisnik ne može da obriše ili deaktivira sam sebe
- QR kodovi moraju biti validan format (bilo koji QR/EAN kod se može skenirati za demo)
- Aplikacija je optimizovana za iOS
- **Operacije i rezervni delovi se konfigurišu na web admin panelu** i automatski preuzimaju u mobilnu aplikaciju
- Sinhronizacija konfiguracije ide samo u jednom pravcu: **Web Panel → Mobilna aplikacija**

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

## 🔒 Sigurnost - Dvofaktorska Autentifikacija (2FA)

### Šta je 2FA?
Dvofaktorska autentifikacija dodaje dodatni sloj sigurnosti vašem nalogu. Pored korisničkog imena i lozinke, morate uneti i 6-cifreni kod koji se menja svakih 30 sekundi.

### Kako funkcionira?
1. **Setup**: Skenirate QR kod sa authenticator aplikacijom (Google Authenticator, Authy, Microsoft Authenticator)
2. **Login**: Nakon unosa lozinke, unosite trenutni 6-cifreni kod iz aplikacije
3. **Backup kodovi**: Dobijate 10 kodova za pristup ako izgubite telefon

### Prednosti:
- ✅ Zaštita od neovlašćenog pristupa
- ✅ Sigurnost čak i ako neko sazna vašu lozinku
- ✅ Backup kodovi za hitne slučajeve
- ✅ Jednostavno omogućavanje/onemogućavanje

### Kako aktivirati 2FA:
1. Otvorite **Profil** tab
2. Pronađite sekciju **"Dvofaktorska autentifikacija"**
3. Kliknite **"Omogući 2FA"**
4. Preuzmite authenticator aplikaciju ako je nemate:
   - [Google Authenticator](https://support.google.com/accounts/answer/1066447) (iOS/Android)
   - [Microsoft Authenticator](https://www.microsoft.com/en-us/security/mobile-authenticator-app) (iOS/Android)
   - [Authy](https://authy.com/) (iOS/Android/Desktop)
5. Skenirajte QR kod prikazan na ekranu
6. Unesite 6-cifreni kod za potvrdu
7. **Sačuvajte 10 backup kodova** na sigurnom mestu!

### Backup kodovi:
- Svaki kod može se koristiti **samo jednom**
- Koristite ih ako nemate pristup telefonu
- Možete ih regenerisati iz Profila
- Čuvajte ih na sigurnom mestu (password manager, papir u sefu, itd.)

### Ako izgubite telefon:
1. Koristite jedan od backup kodova za prijavu
2. Onemogućite 2FA u Profilu
3. Ponovo omogućite sa novim telefonom

---

**Naziv**: La Fantana WHS - Servisni Modul
**Verzija**: 1.0
**Platforma**: iOS (optimizovano)
**Napravljeno sa**: Vibecode AI App Builder

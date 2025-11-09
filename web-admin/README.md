# Water Service Web Admin Panel

Web administrativna aplikacija za upravljanje i pregled podataka iz Water Service mobilne aplikacije.

## 🌐 Funkcionalnosti

### 🔐 Autentifikacija
- Pristup samo za super admin korisnike
- Sigurna prijava sa validacijom
- Sesija čuvana u sessionStorage

### 📊 Dashboard
- Pregled statistika uživo
- Aktivni i završeni servisi
- Broj servisera
- Današnji servisi

### 👥 Upravljanje korisnicima
- Pregled svih korisnika
- Filtriranje po statusu (aktivni/neaktivni)
- Pregled uloga i detalja
- Sinhronizacija sa mobilnom aplikacijom

### 🔧 Istorija servisa
- Kompletan pregled svih servisnih naloga
- Filtriranje po statusu
- Detaljan prikaz svakog servisa:
  - Operacije
  - Rezervni delovi
  - Vremena
  - Napomene

## 🚀 Kako pokrenuti

### Instalacija

```bash
cd web-admin
bun install
```

### Pokretanje development servera

```bash
bun dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

### Production build

```bash
bun run build
bun start
```

## 🔄 Sinhronizacija sa mobilnom aplikacijom

1. Pokrenite web admin panel na računaru
2. U mobilnoj aplikaciji, idite na **Profil → Settings**
3. Unesite URL web panela (npr. `http://192.168.1.100:3000`)
4. Kliknite "Testiraj konekciju"
5. Kada je konekcija uspešna, kliknite "Sinhronizuj sada"

### API Endpoints

- `GET /api/health` - Provera da li server radi
- `POST /api/auth` - Prijava korisnika
- `GET /api/sync/users` - Preuzimanje korisnika
- `POST /api/sync/users` - Sinhronizacija korisnika
- `GET /api/sync/tickets` - Preuzimanje servisa
- `POST /api/sync/tickets` - Sinhronizacija servisa

## 📱 Kako koristiti

### 1. Prva prijava

Pre prve prijave, **morate** sinhronizovati podatke iz mobilne aplikacije:
- Otvorite mobilnu aplikaciju
- Prijavite se kao super admin (admin/admin123)
- Idite na Profil → Settings
- Unesite URL web panela i sinhronizujte

### 2. Prijava na web panel

- Otvorite browser i idite na `http://localhost:3000`
- Korisničko ime: `admin`
- Lozinka: `admin123`

### 3. Navigacija

- **Početna** - Statistika i pregled
- **Korisnici** - Upravljanje korisnicima
- **Servisi** - Istorija svih servisa

## 🛡️ Bezbednost

- Samo super admin korisnici mogu pristupiti
- Podaci se čuvaju u memoriji servera
- Sesija istječe kada se zatvori browser
- Nema perzistencije u production (koristi se in-memory storage)

## 🔧 Tehnologije

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Stilizacija
- **date-fns** - Formatiranje datuma
- **Bun** - Package manager i runtime

## 📝 Napomene

- Web panel je **read-only** - ne može menjati podatke
- Upravljanje korisnicima i servisima se vrši iz mobilne aplikacije
- Podatke treba redovno sinhronizovati za najnovije informacije
- Za production koristi se in-memory storage (ne perzistira između restartova)

## 🌍 Network pristup

Da pristupite web panelu sa drugih uređaja u istoj mreži:

1. Pronađite IP adresu računara:
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Koristite IP adresu umesto localhost:
   ```
   http://192.168.1.100:3000
   ```

3. U mobilnoj aplikaciji koristite istu IP adresu za sinhronizaciju

---

**Verzija**: 1.0
**Platforma**: Web (Desktop optimizovano)
**Kompatibilno sa**: Water Service Mobile App v1.0

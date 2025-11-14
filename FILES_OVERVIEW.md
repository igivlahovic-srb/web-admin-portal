# 📦 Instalacioni paket - Pregled fajlova

Kompletna dokumentacija za instalaciju Web Admin Panela na Ubuntu 22.04.

---

## 📁 Struktura fajlova

```
web-admin/
│
├── 📘 README.md                      (5.9K) - Glavni dokument
├── 🚀 START_HERE.md                  (2.3K) - Početna tačka za nove korisnike
├── 📑 DOCUMENTATION_INDEX.md         (6.1K) - Centralni indeks svih dokumenata
│
├── 📖 Instalaciona dokumentacija:
│   ├── UBUNTU_INSTALL.md             (8.9K) - Kompletna korak-po-korak instalacija
│   ├── QUICK_START.md                (2.9K) - Brza instalacija za iskusne
│   ├── INSTALL_CHECKLIST.md          (5.7K) - Checklist za praćenje
│   └── SYSTEMD_SERVICE.md            (5.7K) - Systemd alternativa za PM2
│
├── 🤖 Instalacioni scripts:
│   ├── install-ubuntu.sh             (12K)  - Automatska instalacija (GLAVNA)
│   ├── test-deployment.sh            (12K)  - Pre-production testiranje
│   └── diagnose.sh                   (2.6K) - Dijagnostika problema
│
├── 📂 Aplikacija (Next.js):
│   ├── app/                          - Next.js app directory
│   ├── lib/                          - Helper funkcije
│   ├── types/                        - TypeScript definicije
│   ├── package.json                  - npm zavisnosti
│   ├── next.config.js                - Next.js config
│   ├── tailwind.config.js            - Tailwind CSS config
│   └── tsconfig.json                 - TypeScript config
│
└── 📝 Ostali:
    ├── .next/                        - Build folder (generisan)
    ├── node_modules/                 - npm paketi (generisan)
    └── bun.lock                      - Bun lock file
```

---

## 📚 Kako koristiti dokumentaciju?

### 🎯 Po tipu korisnika:

**Potpuni početnik:**
```
1. START_HERE.md
2. ./install-ubuntu.sh
3. INSTALL_CHECKLIST.md (prati progress)
4. UBUNTU_INSTALL.md (ako nešto nije jasno)
```

**Iskusan Linux korisnik:**
```
1. QUICK_START.md
2. ./install-ubuntu.sh (ili manuelno)
3. ./test-deployment.sh (verifikacija)
```

**DevOps profesionalac:**
```
1. QUICK_START.md (pregled)
2. Manualna instalacija (custom config)
3. SYSTEMD_SERVICE.md (umesto PM2)
4. ./test-deployment.sh (CI/CD pipeline)
```

---

## 🚀 Glavne instalacione opcije:

### Opcija 1: Automatska (preporučeno)
```bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```
→ Script te provodi kroz sve korake interaktivno

### Opcija 2: Brza manualna
```bash
# Koristi QUICK_START.md komande
curl -fsSL https://bun.sh/install | bash
bun install
bun run build
bun run start
```

### Opcija 3: Detaljna manualna
```bash
# Prati UBUNTU_INSTALL.md korak-po-korak
# Sa objašnjenjima za svaku komandu
```

---

## ✅ Pre produkcije - obavezno!

```bash
chmod +x test-deployment.sh
./test-deployment.sh
```

Ovo testira:
- ✅ Node.js i Bun instalaciju
- ✅ Strukturu projekta
- ✅ Dostupnost portova
- ✅ Firewall konfiguraciju
- ✅ PM2/systemd process manager
- ✅ Nginx reverse proxy
- ✅ HTTP endpoints
- ✅ Sigurnosne provere
- ✅ Network konfiguraciju
- ✅ Resurse sistema (disk, RAM)

**Rezultat:**
- Ako sve prođe ✅ → SPREMAN ZA PRODUKCIJU!
- Ako nešto padne ❌ → Proveri i ispravi

---

## 📊 Veličine fajlova

| Fajl | Veličina | Tip | Vrijeme čitanja |
|------|----------|-----|-----------------|
| README.md | 5.9K | Dokumentacija | 3-5 min |
| START_HERE.md | 2.3K | Quick guide | 1-2 min |
| DOCUMENTATION_INDEX.md | 6.1K | Indeks | 3-5 min |
| UBUNTU_INSTALL.md | 8.9K | Tutorial | 10-15 min |
| QUICK_START.md | 2.9K | Cheat sheet | 2-3 min |
| INSTALL_CHECKLIST.md | 5.7K | Checklist | 5-7 min |
| SYSTEMD_SERVICE.md | 5.7K | Tutorial | 5-7 min |
| install-ubuntu.sh | 12K | Script | - |
| test-deployment.sh | 12K | Script | - |
| diagnose.sh | 2.6K | Script | - |

**Ukupno:** ~70K dokumentacije + 3 skripta

---

## 🎓 Šta svaki fajl radi?

### Dokumentacioni fajlovi:

| Fajl | Svrha | Kada koristiti |
|------|-------|----------------|
| START_HERE.md | Početna tačka | Prvi put ovde |
| README.md | Glavni dokument | Pregled projekta |
| DOCUMENTATION_INDEX.md | Navigacija | Tražim specifičan dokument |
| UBUNTU_INSTALL.md | Korak-po-korak | Detaljna instalacija |
| QUICK_START.md | Brze komande | Znam šta radim |
| INSTALL_CHECKLIST.md | Praćenje | Tokom instalacije |
| SYSTEMD_SERVICE.md | Alternativa | Ne želim PM2 |

### Skripte:

| Skripta | Svrha | Kada pokrenuti |
|---------|-------|----------------|
| install-ubuntu.sh | Automatska instalacija | Početak instalacije |
| test-deployment.sh | Pre-production test | Pre puštanja u prod |
| diagnose.sh | Debug problema | Kad nešto ne radi |

---

## 🔄 Tipičan workflow:

```
1. Prebaci web-admin na server
   └─> scp, git, ili FileZilla

2. Izaberi pristup:
   ├─> Novi korisnik: START_HERE.md
   ├─> Iskusan: QUICK_START.md
   └─> DevOps: Direktno u ./install-ubuntu.sh

3. Instalacija:
   └─> ./install-ubuntu.sh
       ├─> Automatski instalira sve
       └─> Prati INSTALL_CHECKLIST.md

4. Testiranje:
   └─> ./test-deployment.sh
       ├─> Ako prođe ✅ → Gotovo!
       └─> Ako ne ❌ → UBUNTU_INSTALL.md troubleshooting

5. Produkcija:
   └─> Promeni default lozinku
   └─> Poveži mobilnu app
   └─> Done! 🎉
```

---

## 💡 Pro tips:

1. **Uvek prvo pokreni:** `./install-ubuntu.sh`
2. **Pre produkcije:** `./test-deployment.sh`
3. **Ako nešto ne radi:** `./diagnose.sh`
4. **Za detalje:** `UBUNTU_INSTALL.md`
5. **Za brzo rešenje:** `QUICK_START.md`

---

## 🆘 Problem? Poredak rešavanja:

```
1. ./diagnose.sh
   └─> Automatski identifikuje problem

2. UBUNTU_INSTALL.md → Troubleshooting sekcija
   └─> Proveri za tvoj specifičan error

3. INSTALL_CHECKLIST.md
   └─> Šta si možda preskočio?

4. ./test-deployment.sh
   └─> Kompletna dijagnostika sistema
```

---

## 📞 Brzi podaci:

**Što instalira install-ubuntu.sh:**
- Node.js 20.x LTS
- Bun (latest)
- npm paketi (Next.js, React, TypeScript, Tailwind)
- Production build (.next folder)
- UFW firewall (port 3002, 22)
- PM2 process manager (opciono)
- Nginx reverse proxy (opciono)

**Portovi:**
- 3000 - Development
- 3002 - Production (default)
- 80 - HTTP (sa Nginx-om)
- 443 - HTTPS (sa SSL-om)

**Login:**
- Username: `admin`
- Password: `admin123` (PROMENI!)

**Vrijeme instalacije:**
- Automatska: 5-10 minuta
- Manualna: 15-20 minuta
- Sa Nginx/SSL: 20-30 minuta

---

## ✨ Bonus features:

- 🎨 Obojeni output u svim scriptama
- 🔍 10 kategorija automatskih testova
- 🛡️ Sigurnosne provere
- 📊 Resource monitoring
- 🔄 Auto-restart opcije (PM2/systemd)
- 🌐 Nginx ready
- 🔒 SSL ready (Let's Encrypt)
- 📱 Mobile app sync ready

---

**La Fantana WHS - Web Admin Panel**
Verzija: 1.0
Platforma: Ubuntu 22.04 LTS
Deployment Ready: ✅

---

**Sledeći korak:** Otvori `START_HERE.md` ili pokreni `./install-ubuntu.sh`

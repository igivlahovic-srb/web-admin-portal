# 📱 Android APK Build i Auto-Update Sistem - Kompletan Guide

## 🎯 Šta Smo Uradili

Implementiran je kompletan sistem za:
1. ✅ **Build Android APK** na Ubuntu serveru
2. ✅ **Auto-upload APK** na web portal
3. ✅ **Download link** za instalaciju
4. ✅ **Auto-update check** u mobilnoj aplikaciji

---

## 🚀 KORAK 1: Inicijalni Setup Na Ubuntu Serveru

### 1.1. Instalirajte EAS CLI

```bash
# Na Ubuntu serveru
npm install -g eas-cli

# Login (potreban Expo account)
eas login

# Ili koristite existing account credentials
```

### 1.2. Konfiguriše EAS Build

```bash
cd ~/webadminportal

# Inicijalizacija EAS Build
eas build:configure

# Odgovorite:
# - Platform: Android
# - Build type: APK
```

---

## 📦 KORAK 2: Build Prvi APK

Na **Ubuntu serveru**:

```bash
cd ~/webadminportal

# Pokrenite build script
chmod +x BUILD_ANDROID_APK.sh
./BUILD_ANDROID_APK.sh
```

**Šta script radi:**
1. Čita verziju iz `app.json` (npr. 2.1.0)
2. Instalira dependencies
3. Build-uje Android APK sa EAS
4. Kopira APK u `web-admin/public/apk/lafantana-v2.1.0.apk`
5. Postavlja permissions

**Trajanje:** 5-10 minuta

---

## 🌐 KORAK 3: Download APK Sa Web Portala

### Web Portal Već Ima `/mobile-app` Tab

Korisnici mogu:
1. Otvoriti web portal: `http://appserver.lafantanasrb.local:3002`
2. Prijaviti se kao super admin
3. Ići na **"Mobilna aplikacija"** tab
4. Videti trenutnu verziju
5. Kliknuti **"Preuzmi APK"** dugme

APK će se preuzeti kao: `lafantana-v2.1.0.apk`

---

## 📲 KORAK 4: Instalacija APK Na Telefon

### Metod 1: Direktan Download Na Telefonu

1. Otvorite browser na Android telefonu
2. Idite na: `http://appserver.lafantanasrb.local:3002`
3. Login kao super admin
4. Kliknite "Mobilna aplikacija" tab
5. Kliknite "Preuzmi APK"
6. Android će pitati da instalirate - dozvolite "Install from unknown sources"
7. Instalirajte aplikaciju

### Metod 2: USB Transfer

1. Download APK na računar sa web portala
2. Kopirajte APK na telefon preko USB
3. Otvorite fajl na telefonu
4. Instalirajte

---

## 🔄 KORAK 5: Auto-Update Kada Ima Nova Verzija

### Kako Radi Auto-Update?

**Mobilna aplikacija sada automatski:**
1. ✅ Proverava za novu verziju pri pokretanju
2. ✅ Poredi trenutnu verziju (npr. 2.1.0) sa verzijom na portalu (npr. 2.2.0)
3. ✅ Prikazuje dialog ako ima novija verzija
4. ✅ Otvara download link kada korisnik klikne "Preuzmi"

**Implementacija:**
- `src/services/auto-update.ts` - Servis za proveru verzije
- `App.tsx` - Automatski poziva proveru pri pokretanju
- Web portal API `/api/mobile-app` - Vraća info o najnovijoj verziji

---

## 🔢 KORAK 6: Izdavanje Nove Verzije

### 6.1. Update Verziju

```bash
cd ~/webadminportal

# Edit app.json
nano app.json

# Promeni verziju:
# "version": "2.1.0"  →  "version": "2.2.0"
```

### 6.2. Build Novi APK

```bash
./BUILD_ANDROID_APK.sh
```

Script će:
- Pročitati novu verziju (2.2.0)
- Build-ovati APK
- Uploadovati kao `lafantana-v2.2.0.apk`
- **Automatski obrisati stari APK** (lafantana-v2.1.0.apk)

### 6.3. Korisnici Dobijaju Notifikaciju

Kada korisnik otvori aplikaciju:
1. App proverava verziju na portalu
2. Vidi da portal ima 2.2.0, a app je 2.1.0
3. Prikazuje dialog:
   ```
   Nova verzija dostupna!
   Trenutna verzija: 2.1.0
   Nova verzija: 2.2.0

   Želite li da preuzmete novu verziju?

   [Kasnije]  [Preuzmi]
   ```
4. Ako korisnik klikne "Preuzmi", otvara se download link
5. Android preuzima APK i nudi instalaciju

---

## 🛠️ Troubleshooting

### Problem: EAS Build ne radi

```bash
# Instalirajte EAS CLI
npm install -g eas-cli

# Login
eas login

# Re-configure
cd ~/webadminportal
eas build:configure
```

### Problem: "Install from unknown sources" blokiran

Na Android telefonu:
1. Settings → Security
2. Enable "Install unknown apps"
3. Dozvolite browser-u da instalira aplikacije

### Problem: APK se ne download-uje

Proverite da APK postoji:
```bash
ls -la ~/webadminportal/web-admin/public/apk/
```

Proverite permissions:
```bash
chmod 644 ~/webadminportal/web-admin/public/apk/*.apk
```

### Problem: Auto-update ne radi

Proverite da mobilna aplikacija može da pristupe portalu:
```bash
# Na telefonu, otvori browser i idi na:
http://appserver.lafantanasrb.local:3002/api/mobile-app
```

Trebalo bi da vidite JSON sa verzijom.

---

## 📋 Checklist Za Novi Release

- [ ] Update verziju u `app.json`
- [ ] Pokrenite `./BUILD_ANDROID_APK.sh`
- [ ] Proverite da je APK kreiran u `web-admin/public/apk/`
- [ ] Testirajte download sa web portala
- [ ] Instalirajte na test telefon
- [ ] Verifikujte da auto-update radi

---

## 🎯 Flow Dijagram

```
┌─────────────────────────────────────────────────────┐
│ UBUNTU SERVER                                       │
│                                                     │
│  1. Developer → Menja verziju u app.json           │
│  2. Developer → Pokreće ./BUILD_ANDROID_APK.sh     │
│  3. Script    → Build APK sa EAS                   │
│  4. Script    → Kopira u public/apk/               │
│  5. Web Portal→ Servira APK na /apk/lafantana-vX   │
└─────────────────────────────────────────────────────┘
                         │
                         │ HTTP Download
                         ▼
┌─────────────────────────────────────────────────────┐
│ ANDROID TELEFON                                     │
│                                                     │
│  1. User      → Otvori web portal u browser-u      │
│  2. User      → Klikne "Preuzmi APK"               │
│  3. Browser   → Download lafantana-vX.apk          │
│  4. User      → Instalira APK                      │
│                                                     │
│  --- KASNIJE (Kada ima nova verzija) ---           │
│                                                     │
│  5. App       → Pokrene se                         │
│  6. App       → Proveri verziju na portalu         │
│  7. App       → Prikaže "Nova verzija dostupna!"   │
│  8. User      → Klikne "Preuzmi"                   │
│  9. Browser   → Download nova verzija              │
│  10. User     → Instalira update                   │
└─────────────────────────────────────────────────────┘
```

---

## 📞 Support

Za pomoć sa build-om ili update-om, pošaljite:
```bash
# Build log
./BUILD_ANDROID_APK.sh 2>&1 | tee build.log

# APK lista
ls -la ~/webadminportal/web-admin/public/apk/

# Portal version check
curl http://appserver.lafantanasrb.local:3002/api/mobile-app
```

---

**Sve je spremno! Pokrenite `./BUILD_ANDROID_APK.sh` da kreirate prvi APK!** 🚀

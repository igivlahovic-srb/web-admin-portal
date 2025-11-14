# Kako Videti Download Linkove za Android Aplikaciju

## Problem

Nakon što ste kliknuli na "Mobilna aplikacija" tab na web portalu, ne vidite download linkove.

## Razlog

**Download linkovi se prikazuju samo ako postoje APK fajlovi** u `/public/apk/` direktorijumu.

Trenutno NEMA pravog APK fajla jer:
1. Još niste pokrenuli prvi Android build
2. BUILD_ANDROID_APK.sh script još nije pokrenut na Ubuntu serveru

## Privremeno Rešenje (Test Demo)

Kreirano je 3 test APK fajla da možete videti kako izgleda UI:

### Na lokalnom development okruženju:

Fajlovi se nalaze u:
```
/home/user/workspace/web-admin/public/apk/
- lafantana-v2.1.0.apk (najnoviji)
- lafantana-v2.0.0.apk
- lafantana-v1.9.0.apk
```

### Na Ubuntu serveru:

Ovi test fajlovi trenutno NISU na Ubuntu serveru. Morate ih kopirati ili napraviti pravi build.

## Kako Videti Download Linkove

### Opcija 1: Test sa dummy fajlovima (brzo)

Na Ubuntu serveru:

```bash
cd /root/webadminportal/web-admin/public/apk

# Kreiraj test fajlove
cat > lafantana-v2.1.0.apk << 'EOF'
This is a test APK file. Replace with real build.
EOF

cat > lafantana-v2.0.0.apk << 'EOF'
This is a test APK file v2.0.0
EOF

cat > lafantana-v1.9.0.apk << 'EOF'
This is a test APK file v1.9.0
EOF

# Postavi pravilne timestamp-ove
touch -d "2025-11-05 16:45:00" lafantana-v1.9.0.apk
touch -d "2025-11-10 09:15:00" lafantana-v2.0.0.apk
touch -d "2025-11-11 14:30:00" lafantana-v2.1.0.apk

# Proveri
ls -lth
```

Zatim:
1. Otvorite web portal: `http://appserver.lafantanasrb.local:3002`
2. Login kao super admin
3. Kliknite na **"Mobilna aplikacija"** tab
4. Videće 2 sekcije:
   - **Trenutna verzija** sa download dugmetom
   - **Istorija build-ova** tabela sa 3 reda

### Opcija 2: Pravi Android build (preporučeno)

```bash
cd /root/webadminportal

# Prvo morate instalirati EAS CLI i uraditi login
npm install -g eas-cli
eas login

# Konfiguriši EAS Build (prvi put)
eas build:configure

# Pokrenite build
chmod +x BUILD_ANDROID_APK.sh
./BUILD_ANDROID_APK.sh
```

**Trajanje:** 5-10 minuta za build

## Kako Izgleda Kada Radi

### Trenutna Verzija Card:

```
┌────────────────────────────────────┐
│  Trenutna verzija                  │
│                                    │
│  Verzija aplikacije:               │
│  v2.1.0                           │
│                                    │
│  Naziv fajla:                      │
│  lafantana-v2.1.0.apk             │
│                                    │
│  [Preuzmi Android APK]            │
└────────────────────────────────────┘
```

### Istorija Build-ova Tabela:

```
┌────────────────────────────────────────────────────────────────────┐
│  Istorija build-ova (poslednja 3)                                  │
│                                                                     │
│  Verzija  │ Datum build-a     │ Veličina │ Naziv fajla          │ │
│─────────────────────────────────────────────────────────────────────│
│  v2.1.0   │ 11.11.2025 14:30 │ 196 B    │ lafantana-v2.1.0.apk │ │
│  🟢 Najnovije                                         [Preuzmi]  │ │
│─────────────────────────────────────────────────────────────────────│
│  v2.0.0   │ 10.11.2025 09:15 │ 62 B     │ lafantana-v2.0.0.apk │ │
│                                                       [Preuzmi]  │ │
│─────────────────────────────────────────────────────────────────────│
│  v1.9.0   │ 05.11.2025 16:45 │ 62 B     │ lafantana-v1.9.0.apk │ │
│                                                       [Preuzmi]  │ │
└────────────────────────────────────────────────────────────────────┘
```

## Šta Ako Ne Vidim Linkove?

Proverite:

1. **Da li postoje APK fajlovi?**
   ```bash
   ls -lh /root/webadminportal/web-admin/public/apk/*.apk
   ```

2. **Da li su permissions dobri?**
   ```bash
   chmod 644 /root/webadminportal/web-admin/public/apk/*.apk
   ```

3. **Da li je web portal build-ovan?**
   ```bash
   cd /root/webadminportal/web-admin
   npm run build
   pm2 restart lafantana-whs-admin
   ```

4. **Proveri browser konzolu** (F12) za greške

5. **Proveri API endpoint:**
   ```bash
   curl http://localhost:3002/api/mobile-app
   ```

   Trebalo bi da vidite JSON sa `builds` array-om.

## Related Files

- API Route: `/root/webadminportal/web-admin/app/api/mobile-app/route.ts`
- Page: `/root/webadminportal/web-admin/app/mobile-app/page.tsx`
- APK Directory: `/root/webadminportal/web-admin/public/apk/`

---

**Zaključak:** Download linkovi će se automatski prikazati čim imate bar 1 APK fajl u `public/apk/` direktorijumu. Za test, možete kreirati dummy fajlove. Za production, pokrenite `BUILD_ANDROID_APK.sh` script.

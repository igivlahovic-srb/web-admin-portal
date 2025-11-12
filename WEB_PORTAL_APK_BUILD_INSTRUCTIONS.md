# Web Portal - Android APK Build i Upload Instrukcije

## 🎯 Cilj

Build-ovati Android APK i postaviti ga na web portal u sekciji "Mobilna aplikacija".

## 📋 Preduslovi

Na Ubuntu serveru (`/root/webadminportal/`):
- ✅ Node.js i npm instalirani
- ✅ EAS CLI instaliran (`npm install -g eas-cli`)
- ✅ EAS autentifikacija (`eas login`)
- ✅ Internet konekcija (za cloud build)

## 🚀 Metod 1: Automatski Build (Preporučeno)

```bash
# SSH na server
ssh root@appserver.lafantanasrb.local

# Idi u mobilnu app direktorijum
cd /root/webadminportal

# Pokreni build skriptu
./BUILD_ANDROID_APK.sh
```

**Vreme trajanja**: 5-10 minuta

**Šta skripta radi**:
1. Čita verziju iz `app.json`
2. Proverava EAS autentifikaciju
3. Instalira dependencies
4. Build-uje APK pomoću EAS Cloud Build
5. Preuzima APK sa EAS servera
6. Postavlja u `/root/webadminportal/web-admin/public/apk/`
7. Čuva samo poslednja 3 build-a

## 🔧 Metod 2: Ručni Build

### Korak 1: Priprema

```bash
cd /root/webadminportal

# Proveri trenutnu verziju
grep -Po '"version": "\K[^"]*' app.json
```

### Korak 2: Ažuriraj verziju (opciono)

```bash
# Promeni verziju u app.json
nano app.json

# Promeni liniju:
"version": "2.1.0"  →  "version": "2.2.0"
```

### Korak 3: Install dependencies

```bash
npm install
```

### Korak 4: Build APK sa EAS

```bash
npx eas-cli build --platform android --profile production --non-interactive
```

**Napomena**: Ovaj proces traje 5-10 minuta i radi se na EAS cloud serverima.

### Korak 5: Preuzmi APK

```bash
# Dobij download URL poslednjeg build-a
npx eas-cli build:list --platform android --limit 1

# Kopiraj URL iz output-a i preuzmi
VERSION=$(grep -Po '"version": "\K[^"]*' app.json)
curl -L -o /root/webadminportal/web-admin/public/apk/lafantana-v${VERSION}.apk "PASTE_URL_HERE"
```

### Korak 6: Postavi permissions

```bash
chmod 644 /root/webadminportal/web-admin/public/apk/lafantana-v*.apk
```

## 🌐 Provera da li je APK dostupan

### 1. Proveri fajl

```bash
ls -lh /root/webadminportal/web-admin/public/apk/
```

Očekivani output:
```
-rw-r--r-- 1 root root 45M Jan 11 15:30 lafantana-v2.1.0.apk
```

### 2. Test API endpoint

```bash
curl http://localhost:3002/api/mobile-app | jq
```

Očekivani output:
```json
{
  "success": true,
  "data": {
    "hasApk": true,
    "latestVersion": "2.1.0",
    "downloadUrl": "/apk/lafantana-v2.1.0.apk",
    "filename": "lafantana-v2.1.0.apk",
    "size": 47185920
  }
}
```

### 3. Test download link

```bash
curl -I http://localhost:3002/apk/lafantana-v2.1.0.apk
```

Očekivani output:
```
HTTP/1.1 200 OK
Content-Type: application/vnd.android.package-archive
Content-Length: 47185920
```

### 4. Otvori web portal

U browser-u:
```
http://appserver.lafantanasrb.local:3002/mobile-app
```

Trebalo bi da vidite:
- ✅ Status: "Dostupna"
- ✅ Verzija: "2.1.0"
- ✅ Veličina: "45 MB"
- ✅ Dugme "Preuzmi APK" (aktivno)

## 🔄 Ako APK nije vidljiv na portalu

### Restart web portal

```bash
pm2 restart lafantana-whs-admin
```

### Proveri logs

```bash
pm2 logs lafantana-whs-admin --lines 50
```

### Proveri Next.js build

```bash
cd /root/webadminportal/web-admin
npm run build
pm2 restart lafantana-whs-admin
```

## 📤 Alternativa: Upload postojećeg APK-a

Ako već imate build-ovan APK negde drugde:

```bash
# Copy APK sa lokalnog računara na server
scp /path/to/lafantana-v2.1.0.apk root@appserver.lafantanasrb.local:/tmp/

# Na serveru
ssh root@appserver.lafantanasrb.local
mv /tmp/lafantana-v2.1.0.apk /root/webadminportal/web-admin/public/apk/
chmod 644 /root/webadminportal/web-admin/public/apk/lafantana-v2.1.0.apk
```

## 🚨 Troubleshooting

### Greška: "eas-cli not found"

```bash
npm install -g eas-cli
```

### Greška: "Not logged in to EAS"

```bash
eas login
# Otvoriće browser za login
```

Ili koristi token:
```bash
export EXPO_TOKEN=your_expo_token_here
```

### Greška: "Build failed"

Proveri:
- Internet konekciju
- EAS status: https://status.expo.dev
- Build logs: `npx eas-cli build:list`

### APK se ne pojavljuje na portalu

1. Proveri da fajl postoji:
   ```bash
   ls -la /root/webadminportal/web-admin/public/apk/
   ```

2. Proveri permissions:
   ```bash
   chmod 644 /root/webadminportal/web-admin/public/apk/*.apk
   ```

3. Restart portal:
   ```bash
   pm2 restart lafantana-whs-admin
   ```

4. Clear Next.js cache:
   ```bash
   cd /root/webadminportal/web-admin
   rm -rf .next
   npm run build
   pm2 restart lafantana-whs-admin
   ```

## ✅ Build Checklist

Pre build-a:
- [ ] Ažurirana verzija u `app.json`
- [ ] Sve izmene commit-ovane
- [ ] EAS login OK (`eas whoami`)
- [ ] Internet konekcija stabilna

Nakon build-a:
- [ ] APK fajl u `/root/webadminportal/web-admin/public/apk/`
- [ ] API endpoint vraća APK info
- [ ] Download link radi u browser-u
- [ ] Web portal prikazuje APK
- [ ] Mobilna app detektuje update

## 🎯 Quick Commands

```bash
# Build
cd /root/webadminportal && ./BUILD_ANDROID_APK.sh

# Check API
curl http://localhost:3002/api/mobile-app | jq

# List APKs
ls -lh /root/webadminportal/web-admin/public/apk/

# Test download
curl -I http://localhost:3002/apk/lafantana-v2.1.0.apk

# Restart
pm2 restart lafantana-whs-admin
```

---

**Kreirao**: Claude Code
**Za**: La Fantana WHS Web Portal
**Datum**: 2025-01-11

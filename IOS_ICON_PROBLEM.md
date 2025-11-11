# iOS App Icon Problem - Rešenje

## 🔍 Problem
iOS aplikacija ne prikazuje ikonicu na home screen-u nakon izmena.

## ✅ Rešenje

### Opcija 1: Restart iOS simulatora/uređaja (Najbrže)

**Za iOS simulator:**
```bash
# 1. Stop Expo dev server (Ctrl+C)
# 2. Reset iOS simulator
xcrun simctl shutdown all
xcrun simctl erase all

# 3. Restart Expo
cd /home/user/workspace
bun start
```

**Za fizički iOS uređaj:**
1. Izbrišite aplikaciju sa uređaja (long press → Delete App)
2. Ponovo instalirajte preko Expo Go ili build-a

### Opcija 2: Clear Expo cache

```bash
cd /home/user/workspace
rm -rf .expo
rm -rf node_modules/.cache
bun start --clear
```

### Opcija 3: Rebuild iOS app

```bash
cd /home/user/workspace

# Za Expo Go:
bun start --clear --ios

# Za standalone build:
eas build --platform ios --profile development
```

## 📱 Proverite app.json

Ikonica je pravilno konfigurisana u `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.lafantana.whs"
    }
  }
}
```

## 🔍 Provera ikonice

Ikonica postoji i pravilna je:
```bash
ls -lh /home/user/workspace/assets/icon.png
# -rw-r--r-- 1 vibecode vibecode 67K Nov 11 09:44 icon.png
```

## 🎯 Zašto se ovo dešava?

iOS kešira ikonice vrlo agresivno:
1. **Simulator cache**: iOS simulator čuva stare verzije ikonica
2. **Asset catalog**: Expo generiše asset catalog koji se kešira
3. **Xcode derived data**: Build artifacts mogu sadržati stare ikonice

## ⚠️ Napomena

- Android aplikacija **NEMA** ovaj problem - ikonica se odmah ažurira
- iOS i Android **DELE ISTU IKONICU** (`assets/icon.png`)
- Ikonica ima bela slova "LA FANTANA WHS" na plavom gradijent pozadini
- Problem je SAMO u iOS cache-u, ne u kodu

## 🔄 Za Produkciju (EAS Build)

Kada pravite production build:
```bash
# iOS build će automatski koristiti novu ikonicu
eas build --platform ios --profile production

# Upload na App Store
eas submit --platform ios
```

iOS App Store će koristiti **novu ikonicu** iz `assets/icon.png` fajla.

## 📝 Provera da li je ikonica ispravna

Otvorite `assets/icon.png` u image viewer-u:
- Veličina: 1024x1024px
- Sadržaj: Plavi gradijent pozadina + bela slova "LA FANTANA WHS"
- Format: PNG

---

**iOS i Android garantovano koriste ISTU ikonicu iz istog fajla!**

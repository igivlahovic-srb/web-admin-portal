# iOS App Refresh Guide

## Problem: iOS aplikacija nije ažurirana

Ako vaša iOS aplikacija ne prikazuje najnovije promene, sledite ove korake:

## Rešenje 1: Reload u Expo Go (najbrže)

### Na iOS uređaju/simulatoru:
1. **Shake device** ili pritisnite `Cmd + D` (simulator) ili `Cmd + Ctrl + Z` (simulator)
2. Izaberite **"Reload"** iz menija
3. Ili pritisnite `r` u Metro bundler terminalu

### U Metro Bundler terminalu:
```bash
# Pritisnite:
r - Reload app
shift+r - Reload app and clear cache
```

## Rešenje 2: Clear Expo Cache

```bash
# Očistite Expo cache
rm -rf .expo
rm -rf node_modules/.cache

# Restartujte sa čistim cache-om
bun start --clear
# ili
bun start -c
```

## Rešenje 3: Force Full Reload

```bash
# 1. Zaustavite Metro bundler (Ctrl+C)

# 2. Očistite sve cache-ove
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 3. Restart watchman (ako je instaliran)
watchman watch-del-all

# 4. Restartujte Metro sa čistim cache-om
bun start --clear --reset-cache
```

## Rešenje 4: Reinstalirajte aplikaciju na iOS

### Expo Go:
1. Obrišite aplikaciju sa iOS uređaja/simulatora
2. Ponovo skenirajte QR kod
3. Aplikacija će se ponovo instalirati sa svim najnovijim promenama

### iOS Simulator:
```bash
# Reset simulator
xcrun simctl erase all

# Ili za specifičan simulator
xcrun simctl erase "iPhone 15 Pro"
```

## Rešenje 5: Proverite verziju

```bash
# U app.json povećajte verziju
"version": "2.1.1"  # Bilo: "2.1.0"

# Ili promenite runtimeVersion
"runtimeVersion": "2.1.1"
```

## Provera da li je aplikacija ažurirana

Nakon reload-a, proverite:

1. **LoginScreen** - da li se prikazuje novi La Fantana logo?
2. **HistoryScreen** - da li su template literali zamenjeni?
3. **Ikone** - da li prikazuju bela slova (nakon što generišete nove)?

## Automatsko ažuriranje za production

Za production build, koristite Expo Updates:

```json
{
  "updates": {
    "enabled": true,
    "checkAutomatically": "ON_LOAD",
    "fallbackToCacheTimeout": 0
  }
}
```

Ovo omogućava OTA (Over-The-Air) updates bez potrebe za novim build-om.

## Metro Bundler Komande

Tokom razvoja, u Metro bundler terminalu možete koristiti:

- `r` - Reload app
- `shift+r` - Reload and clear cache
- `d` - Open DevTools
- `i` - Open on iOS
- `a` - Open on Android
- `w` - Open on Web
- `j` - Open debugger
- `c` - Clear Metro bundler cache

## Za oba iOS i Android istovremeno

```bash
# 1. Očistite cache
bun start --clear

# 2. U Metro bundler pritisnite:
shift+r   # Reload both iOS and Android with cache clear
```

## Važne napomene

- ✅ Sve promene u `.tsx`, `.ts`, `.js` fajlovima zahtevaju reload
- ✅ Promene u `app.json` zahtevaju restart Metro bundler-a
- ✅ Nove ikone zahtevaju rebuild aplikacije
- ✅ Native promene (iOS/Android config) zahtevaju rebuild
- ⚠️ Development builds ne koriste Expo Updates

## Ako ništa ne radi

```bash
# Nuclear option - potpuna reinstalacija
rm -rf node_modules
rm -rf .expo
rm -rf ios
rm -rf android
bun install
bun start --clear --reset-cache
```

## Dodatni debugging

```bash
# Proveri da li Metro bundler radi
curl http://localhost:8081/status

# Proveri da li je aplikacija povezana
# U Metro bundler terminalu videćete:
# "iOS Bundled 992ms index.ts (1635 modules)"
```

Ako vidite ovu poruku, znači da je iOS aplikacija uspešno učitala kod!

# 🚀 La Fantana WHS - Quick Reference

## Brze Komande

### Reload iOS/Android Aplikacije
```bash
# U Metro bundler terminalu:
r         # Jednostavan reload
shift+r   # Reload sa cache clear (PREPORUČENO)
```

### Očisti Cache i Restart
```bash
# Opcija 1: Brzo
bun start --clear

# Opcija 2: Potpuno
rm -rf .expo && bun start --clear

# Opcija 3: Script (interaktivno)
./refresh-app.sh
```

### Generisanje Ikona sa Belim Slovima
```bash
# 1. Otvori u browser-u:
open generate-icons.html

# 2. Klikni "Preuzmi Sve"

# 3. Zameni fajlove u /assets/:
#    - icon.png
#    - adaptive-icon.png
#    - favicon.png
```

## iOS Ne Prikazuje Promene?

**5-Second Fix:**
1. Na iOS uređaju: **Shake device**
2. Izaberi: **"Reload"**
3. Sačekaj 2-3 sekunde
4. ✅ Done!

**Ako ne radi:**
```bash
rm -rf .expo && bun start --clear
```

## Nedavne Izmene (v2.1.0)

### ✅ LoginScreen
- **Šta**: Novi La Fantana logo
- **Gde**: `src/screens/LoginScreen.tsx:127-133`
- **Kako testirati**: Otvori app → Logo treba da bude veći

### ✅ HistoryScreen
- **Šta**: Uklonjeni template literals
- **Gde**: `src/screens/HistoryScreen.tsx:99,109,162,198,212,226,238`
- **Kako testirati**: Istorija tab → Ne smeju biti greške

### ✅ Web Admin - Mobilna Aplikacija
- **Šta**: Novi tab za Android APK upload
- **Gde**: `/mobile-app` na web portalu
- **Kako testirati**: Web portal → Tab "Mobilna aplikacija"

### ✅ Ikone sa Belim Slovima
- **Šta**: Generator za nove ikone
- **Gde**: `generate-icons.html`
- **Kako testirati**: Otvori HTML → Generiši → Preuzmi

## Sve Promene Rade na iOS i Android! 🎉

React Native = **1 kod**, **2 platforme**

## Metro Bundler Komande

Pritisnite u terminalu:
- `r` - Reload
- `shift+r` - Reload + Clear cache
- `d` - Open DevTools
- `i` - Open iOS
- `a` - Open Android
- `j` - Open Debugger
- `c` - Clear Metro cache

## Detaljne Informacije

- **iOS Refresh**: `IOS_REFRESH_GUIDE.md`
- **iOS/Android Sync**: `IOS_ANDROID_SYNC.md`
- **Ikone**: `ICON_GENERATOR_INSTRUCTIONS.md`
- **README**: `README.md`

## Brza Dijagnostika

### ✅ Sve Radi Ako:
- Metro bundler prikazuje: `iOS Bundled 992ms index.ts (1635 modules)`
- Nema crvenih error poruka u terminalu
- Shake device → Dev menu se otvara
- LoginScreen prikazuje La Fantana logo

### ❌ Problem Ako:
- Metro bundler prikazuje error
- iOS ne reload-uje
- Stara ikona se još uvek prikazuje
- Greške u HistoryScreen

**Rešenje:** `./refresh-app.sh` ili `bun start --clear`

## Kontakt i Podrška

Za dodatna pitanja:
- Pogledaj dokumentaciju u root folder-u
- Proveri `expo.log` za greške
- Koristi `./refresh-app.sh` za brzo rešavanje

---

**Verzija**: 2.1.0
**React Native**: 0.76.7
**Expo SDK**: 53
**Platforma**: iOS & Android

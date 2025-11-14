# Test Prikaza Build Istorije

## Scenario: Korisnik ima 3 build-a

Kada super admin otvori `/mobile-app` tab na web portalu, videće:

### Trenutna Verzija (Card)
- Verzija: **v2.1.0**
- Naziv fajla: lafantana-v2.1.0.apk
- Download dugme: "Preuzmi Android APK"

### Istorija Build-ova (Tabela)

| Verzija | Datum build-a | Veličina | Naziv fajla | Akcije |
|---------|---------------|----------|-------------|---------|
| **v2.1.0** 🟢 Najnovije | 11.11.2025 14:30 | 52.3 MB | lafantana-v2.1.0.apk | [Preuzmi] |
| v2.0.0 | 10.11.2025 09:15 | 51.8 MB | lafantana-v2.0.0.apk | [Preuzmi] |
| v1.9.0 | 05.11.2025 16:45 | 50.5 MB | lafantana-v1.9.0.apk | [Preuzmi] |

## Kako API Vraća Podatke

```json
{
  "success": true,
  "data": {
    "hasApk": true,
    "latestVersion": "2.1.0",
    "downloadUrl": "/apk/lafantana-v2.1.0.apk",
    "fileName": "lafantana-v2.1.0.apk",
    "updatedAt": "2025-11-11T14:30:00.000Z",
    "builds": [
      {
        "name": "lafantana-v2.1.0.apk",
        "version": "2.1.0",
        "size": 54857728,
        "buildDate": "2025-11-11T14:30:00.000Z",
        "downloadUrl": "/apk/lafantana-v2.1.0.apk"
      },
      {
        "name": "lafantana-v2.0.0.apk",
        "version": "2.0.0",
        "size": 54331392,
        "buildDate": "2025-11-10T09:15:00.000Z",
        "downloadUrl": "/apk/lafantana-v2.0.0.apk"
      },
      {
        "name": "lafantana-v1.9.0.apk",
        "version": "1.9.0",
        "size": 52985856,
        "buildDate": "2025-11-05T16:45:00.000Z",
        "downloadUrl": "/apk/lafantana-v1.9.0.apk"
      }
    ]
  }
}
```

## Implementirane Funkcije

### Backend (API Route)
- ✅ `/api/mobile-app` GET endpoint
- ✅ Vraća poslednja 3 build-a sortirana po datumu (najnoviji prvi)
- ✅ Svaki build ima: name, version, size, buildDate, downloadUrl

### Frontend (Page)
- ✅ `formatFileSize()` - Formatira bytes u KB/MB/GB
- ✅ `formatBuildDate()` - Formatira datum u DD.MM.YYYY HH:MM
- ✅ Tabela sa 5 kolona: Verzija, Datum, Veličina, Naziv, Akcije
- ✅ Zeleni badge "Najnovije" za prvi build
- ✅ Plava pozadina za najnoviji red u tabeli
- ✅ Download dugme za svaki build

### Build Script
- ✅ `BUILD_ANDROID_APK.sh`
- ✅ Čuva samo poslednja 3 build-a
- ✅ Automatski briše starije build-ove

## Test Scenario

1. **Inicijalni build:**
   ```bash
   ./BUILD_ANDROID_APK.sh
   ```
   Rezultat: 1 build u direktorijumu

2. **Drugi build (nova verzija):**
   - Promeni verziju u app.json: "2.1.0" → "2.2.0"
   - Pokreni: `./BUILD_ANDROID_APK.sh`
   - Rezultat: 2 build-a u direktorijumu

3. **Treći build:**
   - Promeni verziju: "2.2.0" → "2.3.0"
   - Pokreni script
   - Rezultat: 3 build-a u direktorijumu

4. **Četvrti build (testiranje čišćenja):**
   - Promeni verziju: "2.3.0" → "2.4.0"
   - Pokreni script
   - Rezultat: **Još uvek 3 build-a**, najstariji je obrisan
   - Direktorijum sadrži: v2.4.0, v2.3.0, v2.2.0

## Korišćenje

Super admin na web portalu može:
- ✅ Videti trenutnu verziju na vrhu stranice
- ✅ Preuzeti najnoviji build jednim klikom
- ✅ Videti poslednja 3 build-a u tabeli
- ✅ Preuzeti bilo koji od poslednja 3 build-a
- ✅ Videti tačan datum kada je svaki build napravljen
- ✅ Videti veličinu svakog APK-a

Serviseri mogu:
- ✅ Otvoriti portal na telefonu
- ✅ Preuzeti APK direktno na telefon
- ✅ Instalirati aplikaciju (sa dozvolom za unknown sources)
- ✅ Dobiti auto-update notifikaciju pri sledećem pokretanju aplikacije

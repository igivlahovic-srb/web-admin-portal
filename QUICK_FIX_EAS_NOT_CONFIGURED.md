# BRZI FIX: "EAS project not configured" Greška

## Problem
```
EAS project not configured. Must configure EAS project by running 'eas init'
before this command can be run in non-interactive mode.
```

## Rešenje (3 komande)

Na Ubuntu serveru:

```bash
# 1. Idi u projekat folder
cd /root/webadminportal

# 2. Povuci najnovije izmene (app.json sa EAS project ID)
git pull origin main

# 3. Pokreni deployment script
chmod +x DEPLOY_EAS_CONFIG_FIX.sh
./DEPLOY_EAS_CONFIG_FIX.sh
```

## Šta je fiksirano?

✅ Dodao EAS project ID u `app.json`
✅ Dodao owner field u `app.json`
✅ Konfigurisao updates URL za OTA updates
✅ Sada EAS zna koji projekat da build-uje

## app.json promena:

**Dodato:**
```json
"extra": {
  "eas": {
    "projectId": "279e80a2-142c-4af9-9270-daaa9e5c6763"
  }
},
"owner": "igix"
```

## Testiraj da li radi:

```bash
cd /root/webadminportal
./BUILD_ANDROID_APK.sh
```

**Očekivani output:**
```
Step 4/6: Building Android APK with EAS Cloud Build...
✓ Build started successfully
```

## Ako i dalje ne radi:

Možda nisi logovan na EAS. Loguj se:

```bash
npx eas-cli login
```

**Credentials:**
- Email: `itserbia@lafantana.rs`
- Password: [tvoj password]

Proveri da li si logovan:
```bash
npx eas-cli whoami
```

Trebao bi da vidiš:
```
igix
```

---

**Fix primljen:** 11.11.2025

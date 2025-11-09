# Kako Primeniti Promene na Serveru

## Problem sa GitHub Token-om

GitHub token-i nisu imali `repo` dozvole za push. Sve promene su lokalno commit-ovane i spremne.

## Opcija 1: Patch Fajl (PREPORUČENO)

1. **Preuzmite patch fajl:**
   - Fajl: `latest-changes.patch` (24KB)
   - Sadrži sve promene od commit-a `ef6039b` do najnovijeg

2. **Na serveru, primenite patch:**
```bash
cd /home/itserbia/web-admin
git apply latest-changes.patch
git add -A
git commit -m "Apply latest features: auto-update, time tracking, CRUD, etc."
git push origin main
```

## Opcija 2: Ručni Git Push sa Lokalnog Računara

1. **Klonirajte repo na vašem računaru:**
```bash
git clone https://github.com/igivlahovic-srb/webadminportal.git
cd webadminportal
```

2. **Dodajte Vibecode kao remote i pull-ujte promene:**
```bash
git remote add vibecode [VIBECODE_GIT_URL]
git pull vibecode main
```

3. **Push-ujte na GitHub:**
```bash
git push origin main
```

## Opcija 3: Novi GitHub Token

Kreirajte novi token sa **repo** scope-om:

1. Idite na: https://github.com/settings/tokens
2. Kliknite "Generate new token (classic)"
3. **OBAVEZNO označite checkbox: `repo`** (i sve pod njim)
4. Kliknite "Generate token"
5. Kopirajte token

Zatim na serveru:
```bash
cd /home/itserbia/web-admin
git push https://[TOKEN]@github.com/igivlahovic-srb/webadminportal.git main
```

## Lista Svih Commit-ova

```
0987d36 - dodaj mi na adminpanelu da ako postoji nova verzija...
dbb623d - Add auto-update functionality to admin panel
4edf897 - Na svakoj stranici na panelu dodaj dugme vrati se na dashboard
9f6eefb - Add back to dashboard button on all admin pages
87e0bf6 - Add start time, end time and duration tracking for service tickets
d807423 - Add CRUD and Excel import functionality for operations and spare parts
```

## Šta je Novo?

Pogledajte **CHANGELOG.md** za detaljan pregled svih promena.

Ukratko:
- ✅ Auto-update sistem (notifikacija + one-click update)
- ✅ Dugme "Vrati se na Dashboard" na svim stranicama
- ✅ Praćenje vremena i trajanja servisa (minutama)
- ✅ CRUD i Excel import za operacije i delove
- ✅ Bug fix za login problem

## Nakon Primene Promena

1. **Build-ujte aplikaciju:**
```bash
cd /home/itserbia/web-admin
bun install
bun run build
```

2. **Restartujte aplikaciju:**
```bash
pm2 restart water-service-web-admin
```

3. **Postavite auto-update watcher:**
```bash
pm2 start scripts/auto-update-watcher.sh --name "web-admin-watcher"
pm2 save
```

4. **Proverite da radi:**
- Otvorite admin panel
- Trebalo bi da vidite update notifikaciju (ako ima novih commit-ova)

## Kontakt

Za pitanja ili probleme, kontaktirajte Vibecode support.

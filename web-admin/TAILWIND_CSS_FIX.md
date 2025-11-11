# Tailwind CSS Missing Error - Fix Guide

## Problem

Kada pokušate da uradite update web portala klikanjem na "Ažuriraj" dugme, dobijate grešku:

```
Error: Cannot find module 'tailwindcss'
```

## Uzrok

`npm install` na production serveru ponekad ne instalira `devDependencies` pakete. Tailwind CSS je u `devDependencies` ali je neophodan za build process.

## Rešenje

### Brzo Rešenje (5 minuta)

Na Ubuntu serveru, pokrenite:

```bash
cd /root/webadminportal/web-admin
chmod +x FIX_TAILWIND.sh
./FIX_TAILWIND.sh
```

Script će:
1. Obrisati `node_modules` folder
2. Obrisati `.next` build cache
3. Instalirati SVE dependencies (uključujući devDependencies)
4. Build-ovati aplikaciju

### Manuelno Rešenje

Ako preferirate manuelni pristup:

```bash
cd /root/webadminportal/web-admin

# Očistite stare fajlove
rm -rf node_modules .next

# Instalirajte SVE dependencies (IMPORTANT: --include=dev flag!)
npm install --include=dev

# Build aplikaciju
npm run build

# Restartujte PM2
pm2 restart lafantana-whs-admin
```

**⚠️ VAŽNO:** Uvek koristite `npm install --include=dev` na production serveru kada build-ujete aplikaciju!

## Prevencija

Da biste sprečili ovu grešku u budućnosti, uvek koristite:

```bash
npm install --include=dev  # Instalira SVE dependencies, uključujući devDependencies
```

**NE koristite:**

```bash
npm install --production  # ❌ Ovo preskače devDependencies!
```

umesto:

```bash
npm install --production  # ovo preskače devDependencies
```

## Verifikacija

Nakon fix-a, proverite da Tailwind CSS postoji:

```bash
cd /root/webadminportal/web-admin
ls node_modules | grep tailwindcss
```

Trebalo bi da vidite:
```
tailwindcss
```

## Kako je Došlo do Greške

Verovatno scenario:
1. Web portal update sistem je pokrenuo `npm install` sa production flag-om
2. To je preskočilo instalaciju `tailwindcss` (koji je u devDependencies)
3. Build process je zatražio `tailwindcss` ali ga nije našao
4. Build je failed sa "Cannot find module 'tailwindcss'" greškom

## Related Files

- `/root/webadminportal/web-admin/package.json` - Definiše dependencies
- `/root/webadminportal/web-admin/tailwind.config.js` - Tailwind konfiguracija
- `/root/webadminportal/web-admin/postcss.config.js` - PostCSS konfiguarcija (zahteva Tailwind)
- `/root/webadminportal/web-admin/app/globals.css` - Importuje Tailwind directives

## Tehnički Detalji

Tailwind CSS je **build-time dependency** - neophodan je tokom build procesa da generiše CSS fajlove, ali nije potreban za runtime. Zbog toga je stavljen u `devDependencies`.

Međutim, na production serveru gde build-ujemo aplikaciju, moramo instalirati i dev dependencies.

---

**Zaključak:** Uvek koristite `npm install` (bez flag-ova) na serverima gde build-ujete aplikaciju, čak i ako je to production server.

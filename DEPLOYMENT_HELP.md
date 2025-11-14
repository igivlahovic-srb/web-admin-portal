# Deployment Instrukcije - Web Admin Panel

## Problem: Funkcionalnosti nisu vidljive na panelu nakon git pull

Razlog: Next.js aplikacije zahtevaju **rebuild** nakon svake promene koda.

## Brzo Rešenje (Automatski)

Na serveru, u `web-admin` folderu:

```bash
cd /home/itserbia/webadminportal/web-admin

# Pokreni deploy skriptu
./deploy.sh
```

Deploy skripta automatski radi:
1. Git pull
2. Bun install
3. Bun build
4. PM2 restart

---

## Ručno Rešenje (Korak po Korak)

Ako deploy.sh ne radi, uradite ručno:

### 1. Pull kod
```bash
cd /home/itserbia/webadminportal/web-admin
git pull origin main
```

### 2. Instaliraj dependencies
```bash
bun install
```

### 3. Build aplikaciju (OBAVEZNO!)
```bash
bun run build
```
**Napomena:** Build može da traje 30-60 sekundi. Sačekajte da se završi.

### 4. Restart aplikacije

**Opcija A - PM2 (ako koristite):**
```bash
# Ako app već radi:
pm2 restart water-service-web-admin

# Ako app nije pokrenut:
pm2 start npm --name "water-service-web-admin" -- run start
pm2 save
```

**Opcija B - Systemd (ako koristite):**
```bash
sudo systemctl restart web-admin
```

**Opcija C - Ručno:**
```bash
# Zaustavite trenutni proces (Ctrl+C ako radi u terminalu)
# Zatim:
bun run start
```

### 5. Provera da li radi
```bash
pm2 logs water-service-web-admin
# ili
pm2 list
```

Aplikacija treba da bude na portu **3002**:
- http://localhost:3002
- http://[IP_SERVERA]:3002

---

## Što Ne Vidite Funkcionalnosti

### Problem 1: Build nije urađen
**Simptomi:**
- Stare funkcionalnosti su vidljive
- Novi meni ne postoji
- "Pošalji na Mobilne Uređaje" dugme ne postoji

**Rešenje:**
```bash
bun run build
pm2 restart water-service-web-admin
```

### Problem 2: Keširanje u browseru
**Simptomi:**
- Build je urađen ali još uvek vidite stari UI

**Rešenje:**
- **Hard refresh:** Ctrl+Shift+R (Windows/Linux) ili Cmd+Shift+R (Mac)
- **Ili:** Otvorite Incognito/Private window
- **Ili:** Obrišite browser cache

### Problem 3: Pogrešan port
**Simptomi:**
- Stari panel radi, novi ne

**Rešenje:**
Proverite da pristupate pravom portu:
- Web admin: **3002**
- Dev mode: 3000 (nemojte koristiti ovo)

---

## Verifikacija - Kako Proveriti da Radi

### 1. Provera Navigacionog Menija
- Otvorite bilo koju stranicu (Dashboard, Users, Services, Configuration)
- **Trebalo bi** da vidite meni ispod header-a sa:
  - Početna
  - Korisnici
  - Servisi
  - Konfiguracija

### 2. Provera Configuration Stranice
- Idite na `/configuration`
- **Trebalo bi** da vidite:
  - "Vrati se na Dashboard" dugme (levo)
  - **"Pošalji na Mobilne Uređaje"** dugme (desno, zeleno)
  - Tabove: "Operacije" i "Rezervni delovi"
  - "Import iz CSV/Excel" dugme

### 3. Provera Tabele Rezervnih Delova
- Kliknite tab "Rezervni delovi"
- **Trebalo bi** da vidite kolone:
  - ChItemId
  - ChItemCode
  - ChItemName
  - Jedinica
  - Status
  - Akcije

---

## Logovi i Debugging

### Pogledaj PM2 logove:
```bash
pm2 logs water-service-web-admin --lines 50
```

### Pogledaj build output:
```bash
cd /home/itserbia/webadminportal/web-admin
bun run build
```

### Proveri da li build fajlovi postoje:
```bash
ls -la .next/
```
Trebalo bi da vidite `.next/standalone/` folder.

---

## Česti Problemi

### "Module not found" greška
```bash
rm -rf node_modules .next
bun install
bun run build
```

### "Port 3002 already in use"
```bash
# Nađi proces
lsof -i :3002

# Ubij proces
kill -9 [PID]

# Ili koristi PM2
pm2 delete water-service-web-admin
pm2 start npm --name "water-service-web-admin" -- run start
```

### Build traje predugo
- Normalno je 30-60 sekundi
- Ako više od 5 minuta, Ctrl+C i probajte ponovo
- Proverite disk space: `df -h`

---

## Kontakt za Pomoć

Ako ništa ne radi:

1. Pošaljite screenshot greške
2. Pošaljite output od:
   ```bash
   pm2 list
   pm2 logs water-service-web-admin --lines 20
   ```
3. Proverite `expo.log` na mobilnoj aplikaciji ako testrate sync

---

**Datum:** 09.11.2025
**Vibecode Support**

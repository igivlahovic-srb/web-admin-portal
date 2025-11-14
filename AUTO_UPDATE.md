# Auto-Update Funkcionalnost

## Pregled

Web admin panel sada ima automatsku detekciju i ažuriranje nove verzije aplikacije. Sistem automatski proverava da li postoji nova verzija na GitHub-u i prikazuje notifikaciju administratoru.

## Kako radi

1. **Provera verzije**: Sistem proverava za nove verzije svakih 5 minuta
2. **Notifikacija**: Kada je nova verzija dostupna, prikazuje se plavi banner u gornjem desnom uglu
3. **Ažuriranje**: Administrator klikne na "Ažuriraj sada" dugme
4. **Automatski proces**:
   - Pull najnovijeg koda sa GitHub-a
   - Instaliranje zavisnosti (`bun install`)
   - Build aplikacije (`bun run build`)
   - Restart aplikacije (preko PM2 ili systemd)

## Postavljanje

### Opcija 1: PM2 (Preporučeno)

1. **Instalirajte PM2 ako već nije instaliran:**
```bash
npm install -g pm2
```

2. **Pokrenite aplikaciju sa PM2:**
```bash
cd /home/itserbia/web-admin
pm2 start npm --name "water-service-web-admin" -- run start
pm2 save
pm2 startup
```

3. **Pokrenite auto-update watcher:**
```bash
pm2 start /home/itserbia/web-admin/scripts/auto-update-watcher.sh --name "web-admin-watcher"
pm2 save
```

### Opcija 2: Systemd

1. **Kreirajte systemd servis za watcher:**
```bash
sudo nano /etc/systemd/system/web-admin-watcher.service
```

2. **Dodajte sledeći sadržaj:**
```ini
[Unit]
Description=Web Admin Auto-Update Watcher
After=network.target

[Service]
Type=simple
User=itserbia
WorkingDirectory=/home/itserbia/web-admin
ExecStart=/home/itserbia/web-admin/scripts/auto-update-watcher.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. **Pokrenite servis:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable web-admin-watcher
sudo systemctl start web-admin-watcher
```

4. **Proverite status:**
```bash
sudo systemctl status web-admin-watcher
```

## Git konfiguracija za sigurnost

Da bi ažuriranje radilo bez konflikta, preporučujemo:

1. **Postavite git da automatski rešava konflikte strategijom 'theirs' (preferira remote promene):**
```bash
cd /home/itserbia/web-admin
git config pull.rebase false
git config pull.ff only
```

2. **Alternativno, koristite ovu strategiju koja čuva lokalne promene:**
```bash
git config pull.rebase true
```

## Bezbednost

- Endpoint `/api/update` pokreće bash komande
- Preporučujemo da ograničite pristup samo na super_user role
- Možete dodati dodatnu autentifikaciju ako je potrebno

## API Endpoints

### GET /api/version
Vraća informacije o trenutnoj i najnovijoj verziji:
```json
{
  "success": true,
  "data": {
    "currentVersion": "1.0.0",
    "currentCommit": "abc1234",
    "latestCommit": "def5678",
    "hasUpdate": true
  }
}
```

### POST /api/update
Pokreće proces ažuriranja aplikacije:
```json
{
  "success": true,
  "message": "Ažuriranje uspešno! Aplikacija će se restartovati za nekoliko sekundi..."
}
```

## Rešavanje problema

### Problem: Update ne radi
- Proverite da li aplikacija ima pristup git remote-u
- Proverite da li `bun` komanda radi
- Pogledajte logove: `pm2 logs water-service-web-admin`

### Problem: Aplikacija se ne restartuje
- Proverite da li watcher radi: `pm2 list` ili `systemctl status web-admin-watcher`
- Proverite `/tmp/web-admin-restart-required` flag fajl

### Problem: Git pull konflikti
- Resetujte lokalne promene: `git reset --hard origin/main`
- Ili koristite stash: `git stash && git pull && git stash pop`

## Logovi

- **PM2 logovi aplikacije**: `pm2 logs water-service-web-admin`
- **PM2 logovi watcher-a**: `pm2 logs web-admin-watcher`
- **Systemd logovi**: `journalctl -u web-admin-watcher -f`

## Testiranje

Da testirate funkcionalnost:

1. Napravite commit na GitHub-u
2. Sačekajte do 5 minuta da aplikacija detektuje promenu
3. Kliknite na notifikaciju "Ažuriraj sada"
4. Aplikacija će se automatski ažurirati i restartovati

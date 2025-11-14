# Systemd Service Alternative (umesto PM2)

Ako ne želiš da koristiš PM2, možeš kreirati systemd service koji će automatski pokretati web admin panel na boot-u.

---

## Kreiranje systemd servisa

### 1. Kreiraj service file

```bash
sudo nano /etc/systemd/system/water-admin.service
```

### 2. Dodaj sledeći sadržaj:

```ini
[Unit]
Description=La Fantana WHS Web Admin Panel
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/web-admin
ExecStart=/home/YOUR_USERNAME/.bun/bin/bun run start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=water-admin

# Environment variables (ako su potrebne)
Environment=NODE_ENV=production
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
```

**VAŽNO:** Zameni `YOUR_USERNAME` sa svojim username-om!

### 3. Proveri username

```bash
whoami
# ili
echo $USER
```

### 4. Proveri putanju do Bun-a

```bash
which bun
# Obično: /home/USERNAME/.bun/bin/bun
```

---

## Pokretanje servisa

### Reload systemd

```bash
sudo systemctl daemon-reload
```

### Omogući auto-start

```bash
sudo systemctl enable water-admin
```

### Startuj servis

```bash
sudo systemctl start water-admin
```

### Proveri status

```bash
sudo systemctl status water-admin
```

Trebalo bi da vidiš "Active: active (running)" u zeleno.

---

## Upravljanje servisom

```bash
# Zaustavi servis
sudo systemctl stop water-admin

# Restartuj servis
sudo systemctl restart water-admin

# Proveri status
sudo systemctl status water-admin

# Prikaži logove
sudo journalctl -u water-admin -f

# Prikaži poslednjih 50 linija logova
sudo journalctl -u water-admin -n 50

# Onemogući auto-start
sudo systemctl disable water-admin
```

---

## Verifikacija

### 1. Proveri da li servis radi

```bash
sudo systemctl status water-admin
```

Očekivani output:
```
● water-admin.service - La Fantana WHS Web Admin Panel
     Loaded: loaded (/etc/systemd/system/water-admin.service; enabled)
     Active: active (running) since ...
```

### 2. Proveri port

```bash
sudo ss -tlnp | grep 3002
```

### 3. Test HTTP zahtev

```bash
curl http://localhost:3002
```

### 4. Proveri logove

```bash
sudo journalctl -u water-admin -n 20
```

---

## Prednosti systemd vs PM2

### Systemd prednosti:
- ✅ Nativno u Linux-u (ne zahteva dodatne pakete)
- ✅ Niži overhead (manje resursa)
- ✅ Bolji logging (journalctl)
- ✅ Sigurniji (run as specific user)
- ✅ Bolja integracija sa OS-om

### PM2 prednosti:
- ✅ Cross-platform (Windows, Mac, Linux)
- ✅ Web dashboard
- ✅ Real-time monitoring (`pm2 monit`)
- ✅ Cluster mode (multiple instances)
- ✅ Key metrics i monitoring

---

## Troubleshooting

### Problem: Service failed to start

```bash
# Proveri detaljne logove
sudo journalctl -u water-admin -xe

# Proveri da li Bun postoji
ls -la /home/YOUR_USERNAME/.bun/bin/bun

# Proveri da li web-admin folder postoji
ls -la /home/YOUR_USERNAME/web-admin

# Test manuelno
cd ~/web-admin
bun run start
```

### Problem: Permission denied

```bash
# Proveri ownership
ls -la /home/YOUR_USERNAME/web-admin

# Popravi ownership
sudo chown -R YOUR_USERNAME:YOUR_USERNAME /home/YOUR_USERNAME/web-admin
```

### Problem: Port već zauzet

```bash
# Pronađi šta koristi port 3002
sudo lsof -i :3002

# Ubij proces
sudo kill -9 PID
```

---

## Primer kompletan service file

```ini
[Unit]
Description=La Fantana WHS Web Admin Panel
Documentation=https://github.com/your-repo
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/web-admin
ExecStart=/home/ubuntu/.bun/bin/bun run start
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=water-admin

# Environment
Environment=NODE_ENV=production
Environment=PORT=3002

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/ubuntu/web-admin

# Resource limits
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

---

## Auto-restart na izmene fajlova (opciono)

Ako želiš da servis automatski restartuje kada se promene fajlovi:

```bash
sudo nano /etc/systemd/system/water-admin.path
```

Dodaj:
```ini
[Unit]
Description=Watch for changes in water-admin

[Path]
PathModified=/home/YOUR_USERNAME/web-admin/.next

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable water-admin.path
sudo systemctl start water-admin.path
```

---

## Kombinacija: systemd + Nginx

Koristi systemd za aplikaciju i Nginx kao reverse proxy:

1. **Systemd** upravlja aplikacijom (port 3002)
2. **Nginx** prima HTTP zahteve (port 80/443) i prosleđuje na 3002

Ovo je **najbolja praksa** za production!

---

## Monitoring sa systemd

### Real-time logovi

```bash
sudo journalctl -u water-admin -f
```

### Logovi sa vremenskog perioda

```bash
# Danas
sudo journalctl -u water-admin --since today

# Poslednjih sat vremena
sudo journalctl -u water-admin --since "1 hour ago"

# Između dva datuma
sudo journalctl -u water-admin --since "2025-01-01" --until "2025-01-31"
```

### Izvoz logova

```bash
# U fajl
sudo journalctl -u water-admin > water-admin.log

# Samo errors
sudo journalctl -u water-admin -p err
```

---

## Zaključak

**Sistemd je bolji izbor ako:**
- Želiš jednostavno rešenje bez dodatnih paketa
- Ne trebaš cross-platform podršku
- Preferiš native Linux alate
- Imaš samo jednu instancu aplikacije

**PM2 je bolji izbor ako:**
- Trebaš cross-platform rešenje
- Želiš web monitoring dashboard
- Planiraš cluster mode (multiple instances)
- Preferiš vizuelni monitoring

**Za produkciju preporučujem: Systemd + Nginx**

---

**La Fantana WHS - Web Admin Panel**
Verzija: 1.0

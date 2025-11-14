# 🚀 La Fantana WHS - Web Admin Portal
# Ubuntu Production Deployment Guide

## 📋 Preduslovi

Potrebno je da imaš:
- ✅ Ubuntu Server (18.04 ili noviji)
- ✅ SSH pristup sa sudo pravima
- ✅ Minimum 1GB RAM
- ✅ 5GB slobodnog prostora na disku

---

## 🎯 Quick Start (5 minuta)

### Opcija 1: Automatski Deployment (Preporučeno)

```bash
# 1. Skopiraj ceo web-admin folder na server
scp -r web-admin root@your-server-ip:/root/

# 2. Konektuj se na server
ssh root@your-server-ip

# 3. Idi u folder
cd /root/web-admin

# 4. Pokreni deployment skriptu
sudo bash DEPLOY_TO_UBUNTU.sh
```

**To je to!** Portal će biti dostupan na `https://admin.lafantanasrb.local`

---

## 📦 Opcija 2: Manuelna Instalacija (Korak po korak)

### 1. Kopiraj fajlove na server

```bash
# Sa tvog lokalnog računara
scp -r web-admin root@your-server-ip:/root/
```

### 2. Instaliraj Node.js i Bun

```bash
# Konektuj se na server
ssh root@your-server-ip

# Instaliraj Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Instaliraj Bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
```

### 3. Instaliraj Nginx i PM2

```bash
# Nginx
sudo apt-get update
sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2
```

### 4. Napravi deployment folder

```bash
sudo mkdir -p /var/www/lafantana-admin
sudo cp -r /root/web-admin/* /var/www/lafantana-admin/
cd /var/www/lafantana-admin
```

### 5. Podesi environment fajl

```bash
sudo nano /var/www/lafantana-admin/.env.local
```

Kopiraj sledeće:

```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=lafantana_whs
DB_USER=admin
DB_PASSWORD=admin123
DB_PORT=1433

# Use SQLite by default
USE_MSSQL=false

# Production
NODE_ENV=production
```

### 6. Build aplikaciju

```bash
cd /var/www/lafantana-admin
bun install --production
bun run build
```

### 7. Podesi PM2

```bash
# Zaustavi stari proces ako postoji
pm2 delete lafantana-whs-admin 2>/dev/null || true

# Pokreni aplikaciju
pm2 start bun --name lafantana-whs-admin -- start

# Sačuvaj PM2 konfiguraciju
pm2 save

# Podesi PM2 da se pokreće pri boot-u
pm2 startup
# (Kopiraj i pokreni komandu koju PM2 ispiše)
```

### 8. Konfiguriši Nginx

```bash
# Kreiraj SSL certifikat
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/lafantana-whs-admin.key \
    -out /etc/nginx/ssl/lafantana-whs-admin.crt \
    -subj "/C=RS/ST=Belgrade/L=Belgrade/O=La Fantana/OU=IT/CN=admin.lafantanasrb.local"

# Kreiraj nginx config
sudo nano /etc/nginx/sites-available/lafantana-whs-admin
```

Kopiraj sledeću konfiguraciju:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name admin.lafantanasrb.local;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.lafantanasrb.local;

    # SSL
    ssl_certificate /etc/nginx/ssl/lafantana-whs-admin.crt;
    ssl_certificate_key /etc/nginx/ssl/lafantana-whs-admin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logs
    access_log /var/log/nginx/lafantana-admin-access.log;
    error_log /var/log/nginx/lafantana-admin-error.log;

    client_max_body_size 50M;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

```bash
# Omogući site
sudo ln -s /etc/nginx/sites-available/lafantana-whs-admin /etc/nginx/sites-enabled/

# Testiraj nginx config
sudo nginx -t

# Restartuj nginx
sudo systemctl reload nginx
```

### 9. Podesi permissions

```bash
sudo chown -R www-data:www-data /var/www/lafantana-admin
sudo chmod -R 755 /var/www/lafantana-admin
```

### 10. Otvori firewall portove

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## 🌐 Pristup Portalu

Nakon deployment-a, portal je dostupan na:

**URL:** `https://admin.lafantanasrb.local` (ili IP tvog servera)

**Login:**
- Username: `admin`
- Password: `admin123`

---

## 🔧 DNS/Hosts Konfiguracija

### Za pristup sa drugih računara u lokalnoj mreži:

**Na Windows:** (kao Administrator)
```
notepad C:\Windows\System32\drivers\etc\hosts
```

**Na Linux/Mac:**
```bash
sudo nano /etc/hosts
```

Dodaj:
```
192.168.1.X    admin.lafantanasrb.local
```
(Zameni `192.168.1.X` sa IP adresom tvog servera)

---

## 📱 Instalacija SSL Certifikata (Opciono)

Da bi izbegao browser upozorenja:

### Preuzmi certifikat sa servera:

```bash
scp root@your-server-ip:/etc/nginx/ssl/lafantana-whs-admin.crt ./
```

### Na Windows:
1. Double-click na `.crt` fajl
2. "Install Certificate" → "Local Machine"
3. "Place all certificates in the following store" → "Trusted Root Certification Authorities"

### Na Linux:
```bash
sudo cp lafantana-whs-admin.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### Na Mac:
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain lafantana-whs-admin.crt
```

---

## 🛠️ Upravljanje Portalom

### PM2 komande:

```bash
# Status
pm2 status

# Logovi (uživo)
pm2 logs lafantana-whs-admin

# Restartuj
pm2 restart lafantana-whs-admin

# Zaustavi
pm2 stop lafantana-whs-admin

# Pokreni
pm2 start lafantana-whs-admin

# Obriši iz PM2
pm2 delete lafantana-whs-admin
```

### Nginx komande:

```bash
# Status
sudo systemctl status nginx

# Restartuj
sudo systemctl restart nginx

# Reload config (bez downtime-a)
sudo systemctl reload nginx

# Test config
sudo nginx -t

# Logovi
sudo tail -f /var/log/nginx/lafantana-admin-access.log
sudo tail -f /var/log/nginx/lafantana-admin-error.log
```

### Aplikacioni logovi:

```bash
# PM2 logs
pm2 logs lafantana-whs-admin --lines 100

# System logs
journalctl -u nginx -f
```

---

## 🔄 Update/Redeploy

Kada želiš da updateuješ portal:

```bash
# 1. Skopiraj nove fajlove
scp -r web-admin root@your-server-ip:/root/

# 2. SSH na server
ssh root@your-server-ip

# 3. Backup trenutne verzije
cp -r /var/www/lafantana-admin /var/www/lafantana-admin.backup

# 4. Kopiraj nove fajlove (čuva data/ folder)
rsync -av --exclude 'node_modules' --exclude '.next' --exclude 'data' \
  /root/web-admin/ /var/www/lafantana-admin/

# 5. Rebuild
cd /var/www/lafantana-admin
bun install --production
bun run build

# 6. Restartuj PM2
pm2 restart lafantana-whs-admin
```

---

## 🐛 Troubleshooting

### Portal ne radi (502 Bad Gateway)

```bash
# Proveri da li Next.js app radi
pm2 status
pm2 logs lafantana-whs-admin

# Ako nije, pokreni ga
pm2 restart lafantana-whs-admin
```

### SSL greške

```bash
# Regeneriši certifikat
sudo rm /etc/nginx/ssl/lafantana-whs-admin.*
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/lafantana-whs-admin.key \
    -out /etc/nginx/ssl/lafantana-whs-admin.crt \
    -subj "/C=RS/ST=Belgrade/L=Belgrade/O=La Fantana/OU=IT/CN=admin.lafantanasrb.local"
sudo systemctl reload nginx
```

### Build greške

```bash
# Obriši node_modules i rebuild
cd /var/www/lafantana-admin
rm -rf node_modules .next
bun install --production
bun run build
pm2 restart lafantana-whs-admin
```

### Port 3000 zauzet

```bash
# Proveri šta koristi port 3000
sudo lsof -i :3000

# Ubij proces
sudo kill -9 <PID>

# Ili promeni port u ecosystem.config.js
```

---

## 📊 Performance Monitoring

### System resursi:

```bash
# CPU i RAM
htop

# Disk space
df -h

# PM2 monitoring
pm2 monit
```

### Logovi:

```bash
# Real-time logs
pm2 logs lafantana-whs-admin --lines 50

# Nginx access log
sudo tail -f /var/log/nginx/lafantana-admin-access.log

# Nginx error log
sudo tail -f /var/log/nginx/lafantana-admin-error.log
```

---

## 🔐 Security Best Practices

1. **Promeni default login:**
   - Idi u portal → Users → Izmeni admin korisnika

2. **Firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   ```

3. **SSH Key Only (Opciono):**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Postavi: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

4. **Auto-updates:**
   ```bash
   sudo apt-get install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

---

## ✅ Production Checklist

Pre nego što pustiš u produkciju:

- [ ] Portal radi i dostupan je preko HTTPS
- [ ] Login radi sa test kredencijalima
- [ ] SSL certifikat instaliran na klijentima
- [ ] PM2 pokreće app automatski pri boot-u
- [ ] Firewall konfigurisan
- [ ] Backup sistem testiran
- [ ] Logovi se pišu ispravno
- [ ] DNS/hosts fajl ažuriran
- [ ] Default lozinka promenjena

---

## 📞 Support

Ako imaš problema:

1. Proveri PM2 status: `pm2 status`
2. Proveri PM2 logove: `pm2 logs`
3. Proveri Nginx logove: `sudo tail -f /var/log/nginx/lafantana-admin-error.log`
4. Testiraj nginx config: `sudo nginx -t`

---

**Kreirao:** Claude Code
**Za:** La Fantana WHS Admin Portal
**Verzija:** 2.1.0
**Datum:** 2025-11-14

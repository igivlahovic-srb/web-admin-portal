# 🚀 DEPLOYMENT WEB PORTALA NA UBUNTU - KOMPLETNO UPUTSTVO

## 📋 Šta Vam Treba

- **Ubuntu Server 22.04+** (ili Debian 11+)
- **Root pristup** (SSH)
- **Minimalno 2GB RAM**
- **Minimalno 10GB disk prostora**
- **Internet konekcija**

---

## ⚡ BRZA INSTALACIJA (Preporučeno)

### **Metod 1: Automatski Script (Najlakši)**

Prebacite `DEPLOY_WEB_PORTAL_UBUNTU.sh` script na server i pokrenite:

```bash
# Sa vašeg računara - prebacite script na server
scp DEPLOY_WEB_PORTAL_UBUNTU.sh root@YOUR_SERVER_IP:/root/

# Konektujte se na server
ssh root@YOUR_SERVER_IP

# Pokrenite automatski deployment
cd /root
chmod +x DEPLOY_WEB_PORTAL_UBUNTU.sh
sudo bash DEPLOY_WEB_PORTAL_UBUNTU.sh
```

**Gotovo!** Script će automatski:
- ✅ Instalirati Node.js, Bun, Git, PM2, Nginx
- ✅ Klonirati web portal sa GitHub-a
- ✅ Instalirati dependencies
- ✅ Build-ovati projekat
- ✅ Pokrenuti sa PM2
- ✅ Konfigurisati Nginx reverse proxy
- ✅ Podesiti firewall

---

### **Metod 2: Direktan Download i Pokretanje**

```bash
# Konektujte se na server
ssh root@YOUR_SERVER_IP

# Download script direktno sa GitHub
wget https://raw.githubusercontent.com/igivlahovic-srb/web-admin-portal/main/DEPLOY_WEB_PORTAL_UBUNTU.sh

# Ili curl
curl -O https://raw.githubusercontent.com/igivlahovic-srb/web-admin-portal/main/DEPLOY_WEB_PORTAL_UBUNTU.sh

# Pokrenite
chmod +x DEPLOY_WEB_PORTAL_UBUNTU.sh
sudo bash DEPLOY_WEB_PORTAL_UBUNTU.sh
```

---

## 📝 MANUELNA INSTALACIJA (Korak po Korak)

Ako želite da razumete svaki korak ili imate specifične potrebe:

### **KORAK 1: Konektovanje na Server**

```bash
ssh root@YOUR_SERVER_IP
# ili
ssh username@YOUR_SERVER_IP
```

### **KORAK 2: Ažuriranje Sistema**

```bash
sudo apt update
sudo apt upgrade -y
```

### **KORAK 3: Instalacija Node.js 20.x**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Provera
node --version  # Trebalo bi: v20.x.x
npm --version   # Trebalo bi: 10.x.x
```

### **KORAK 4: Instalacija Bun**

```bash
curl -fsSL https://bun.sh/install | bash

# Dodaj u PATH
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Provera
bun --version  # Trebalo bi: 1.x.x
```

### **KORAK 5: Instalacija Git**

```bash
sudo apt install -y git
git --version  # Provera
```

### **KORAK 6: Instalacija PM2**

```bash
sudo npm install -g pm2
pm2 --version  # Provera
```

### **KORAK 7: Kloniranje Web Portala**

```bash
cd ~
git clone https://github.com/igivlahovic-srb/web-admin-portal.git
cd web-admin-portal
```

### **KORAK 8: Kreiranje Environment Fajla**

```bash
nano .env.local
```

Dodajte:

```env
PORT=3000
NODE_ENV=production
DATA_DIR=./data
```

Sačuvajte: `Ctrl+O`, `Enter`, `Ctrl+X`

### **KORAK 9: Kreiranje Data Direktorijuma**

```bash
mkdir -p data
```

### **KORAK 10: Instalacija Dependencies**

```bash
bun install
```

⏱️ **Ovo može potrajati 2-5 minuta...**

### **KORAK 11: Build Projekta**

```bash
bun run build
```

⏱️ **Ovo može potrajati 3-10 minuta...**

### **KORAK 12: Test Pokretanje**

```bash
# Probajte da pokrenete
bun run start

# Trebalo bi da vidite:
# ▲ Next.js 15.x.x
# - Local: http://localhost:3000
```

Otvorite novi terminal i testirajte:

```bash
curl http://localhost:3000
```

Ako radi, pritisnite `Ctrl+C` da zaustavite.

### **KORAK 13: Pokretanje sa PM2**

```bash
# Pokreni aplikaciju
pm2 start bun --name "web-admin-portal" -- run start

# Omogući auto-start pri boot-u
pm2 startup
# ⚠️ VAŽNO: Kopirajte komandu koju PM2 prikaže i izvršite je

# Sačuvaj konfiguraciju
pm2 save

# Provera
pm2 status
pm2 logs web-admin-portal
```

### **KORAK 14: Instalacija i Konfigurisanje Nginx**

```bash
# Instaliraj Nginx
sudo apt install -y nginx

# Kreiraj konfiguraciju
sudo nano /etc/nginx/sites-available/web-admin-portal
```

Dodajte:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/web-admin-portal-access.log;
    error_log /var/log/nginx/web-admin-portal-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sačuvajte i aktivirajte:

```bash
# Omogući sajt
sudo ln -sf /etc/nginx/sites-available/web-admin-portal /etc/nginx/sites-enabled/

# Ukloni default
sudo rm -f /etc/nginx/sites-enabled/default

# Testiraj konfiguraciju
sudo nginx -t

# Restartuj Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### **KORAK 15: Konfigurisanje Firewall-a**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Provera
sudo ufw status
```

### **KORAK 16: Testiranje**

```bash
# Dobijte IP adresu servera
hostname -I

# Testirajte lokalno
curl http://localhost:3000

# Testirajte eksterno (sa vašeg računara)
# Otvorite browser: http://YOUR_SERVER_IP
```

---

## 🌐 PRISTUP WEB PORTALU

Nakon uspešnog deployment-a:

**URL:** `http://YOUR_SERVER_IP`

**Login:**
- Username: `admin`
- Password: `admin123`

---

## 📱 KONEKCIJA MOBILNE APLIKACIJE

### **1. Pronađite IP Adresu Servera**

Na serveru:

```bash
hostname -I
# Primer output: 192.168.1.100
```

### **2. Konfigurisanje Mobilne Aplikacije**

1. Otvorite **La Fantana WHS** mobilnu aplikaciju
2. Prijavite se kao **admin** / **admin123**
3. Idite na **Profil** → **Settings** (ikonica zupčanika)
4. U polje "Web Admin URL" unesite:
   ```
   http://YOUR_SERVER_IP:3000
   ```
   **Primer:** `http://192.168.1.100:3000`

5. Kliknite **"Testiraj konekciju"**
   - ✅ Ako je uspešno: videćete "Konekcija uspešna!"
   - ❌ Ako nije: proverite IP adresu i da li su telefon i server na istoj mreži

6. Kliknite **"Sinhronizuj sada"** da prebacite sve podatke

### **3. Provera Sinhronizacije**

1. Otvorite web portal u browser-u: `http://YOUR_SERVER_IP`
2. Prijavite se kao **admin**
3. Trebalo bi da vidite:
   - Sve korisnike iz mobilne aplikacije
   - Sve servise
   - Statistike

---

## 🔧 KORISNE KOMANDE ZA ODRŽAVANJE

### **Provera Statusa**

```bash
# PM2 status
pm2 status
pm2 logs web-admin-portal
pm2 monit

# Nginx status
sudo systemctl status nginx
sudo nginx -t

# Sistem resources
htop
df -h
free -h
```

### **Restartovanje Aplikacije**

```bash
pm2 restart web-admin-portal
```

### **Ažuriranje sa GitHub-a**

```bash
cd ~/web-admin-portal
git pull origin main
bun install
bun run build
pm2 restart web-admin-portal
```

### **Nginx Logovi**

```bash
# Access log
sudo tail -f /var/log/nginx/web-admin-portal-access.log

# Error log
sudo tail -f /var/log/nginx/web-admin-portal-error.log
```

### **Zaustavljanje Aplikacije**

```bash
pm2 stop web-admin-portal
```

### **Brisanje PM2 Procesa**

```bash
pm2 delete web-admin-portal
```

---

## 🔒 SSL SERTIFIKAT (Opciono)

Za HTTPS konekciju sa Let's Encrypt:

```bash
# Instalacija Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dobijanje SSL sertifikata
sudo certbot --nginx -d admin.lafantanasrb.com

# Auto-renewal test
sudo certbot renew --dry-run
```

Nakon SSL instalacije, URL će biti: `https://admin.lafantanasrb.com`

---

## 🐛 TROUBLESHOOTING

### Problem: "Network request failed" u mobilnoj aplikaciji

**Rešenje:**
- ❌ NE koristite `localhost` ili `127.0.0.1`
- ✅ Koristite pravu IP adresu servera (npr. `192.168.1.100`)
- Proverite da su telefon i server na istoj WiFi mreži
- Proverite firewall da dozvoljava port 3000

### Problem: PM2 ne startuje aplikaciju

**Rešenje:**
```bash
# Pogledajte logove
pm2 logs web-admin-portal

# Restart
pm2 restart web-admin-portal

# Ili rebuild
cd ~/web-admin-portal
bun run build
pm2 restart web-admin-portal
```

### Problem: Nginx prikazuje 502 Bad Gateway

**Rešenje:**
```bash
# Provera da li aplikacija radi
pm2 status
curl http://localhost:3000

# Ako ne radi, restartuj
pm2 restart web-admin-portal

# Provera Nginx konfiguracije
sudo nginx -t
sudo systemctl restart nginx
```

### Problem: Port 3000 je zauzet

**Rešenje:**
```bash
# Pronađi proces koji koristi port
sudo lsof -i :3000

# Ubij proces (zameni PID sa pravim ID-em)
sudo kill -9 PID

# Ili promeni port u .env.local
nano ~/web-admin-portal/.env.local
# Promeni PORT=3000 na PORT=3001
pm2 restart web-admin-portal
```

---

## 📊 PERFORMANSE I RESURSI

### **Preporučene Specifikacije:**

- **Minimalno:**
  - 1 CPU Core
  - 2GB RAM
  - 10GB Disk
  - Ubuntu 22.04

- **Preporučeno:**
  - 2 CPU Cores
  - 4GB RAM
  - 20GB SSD
  - Ubuntu 22.04 LTS

### **Optimizacija:**

```bash
# PM2 cluster mode (višestruki procesi)
pm2 delete web-admin-portal
pm2 start bun --name "web-admin-portal" -i max -- run start

# Nginx caching (već konfigurisano u script-u)
```

---

## 📞 PODRŠKA

Za dodatne probleme ili pitanja:

1. Proverite logove: `pm2 logs web-admin-portal`
2. Proverite Nginx logove: `sudo tail -f /var/log/nginx/error.log`
3. Kontaktirajte podršku sa error porukama

---

## ✅ CHECKLIST NAKON DEPLOYMENT-A

- [ ] Web portal dostupan na `http://SERVER_IP`
- [ ] Login radi sa admin/admin123
- [ ] Dashboard prikazuje statistike
- [ ] PM2 status: `online`
- [ ] Nginx status: `active (running)`
- [ ] Firewall konfigurisan
- [ ] Mobilna aplikacija povezana sa portalom
- [ ] Sinhronizacija radi
- [ ] (Opciono) SSL sertifikat instaliran

---

**Autor:** La Fantana WHS Team
**Verzija:** 1.0
**Datum:** 2025
**Licenca:** Private

---

**🎉 Čestitamo! Vaš web portal je uspešno deployovan!**

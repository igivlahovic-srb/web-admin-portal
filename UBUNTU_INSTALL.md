# Instalacija Web Admin Panela na Ubuntu 22.04

Kompletna instalaciona dokumentacija za La Fantana WHS Web Admin Panel na fresh Ubuntu 22.04 serveru.

---

## 📋 Preduslovi

- Ubuntu 22.04 LTS server (fresh instalacija)
- Root ili sudo pristup
- Minimalno 1GB RAM
- Internet konekcija

---

## 🚀 Korak 1: Ažuriranje sistema

Prvo ažurirajmo sistem na najnoviju verziju:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## 🔧 Korak 2: Instalacija Node.js (potrebno za Bun)

Instaliramo Node.js 20.x (LTS verzija):

```bash
# Dodaj NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instaliraj Node.js
sudo apt install -y nodejs

# Proveri instalaciju
node --version
npm --version
```

---

## ⚡ Korak 3: Instalacija Bun

Bun je brži JavaScript runtime koji koristimo umesto npm:

```bash
# Instaliraj Bun
curl -fsSL https://bun.sh/install | bash

# Dodaj Bun u PATH (automatski se dodaje u ~/.bashrc)
source ~/.bashrc

# Proveri instalaciju
bun --version
```

Ako `bun --version` ne radi, manuelno dodaj u PATH:

```bash
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📦 Korak 4: Kloniranje projekta

Ako projekat nije već na serveru, prebaci ga:

### Opcija A: Korišćenjem Git

```bash
# Instaliraj Git ako nije instaliran
sudo apt install -y git

# Kloniraj projekat
cd ~
git clone https://github.com/your-repo/water-service-app.git
cd water-service-app/web-admin
```

### Opcija B: Korišćenjem SCP/SFTP

```bash
# Sa lokalnog računara (Windows/Mac/Linux):
scp -r web-admin/ korisnik@server-ip:/home/korisnik/

# Zatim na serveru:
cd ~/web-admin
```

### Opcija C: Manual upload

Koristi FileZilla ili WinSCP da prekopiraš `web-admin` folder na server.

---

## 📥 Korak 5: Instalacija zavisnosti

```bash
cd ~/web-admin

# Instaliraj sve npm pakete
bun install
```

Ovo instalira:
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- date-fns

---

## 🔥 Korak 6: Build aplikacije za produkciju

```bash
# Build Next.js aplikacije
bun run build
```

Ovo kreira optimizovanu produkcijsku verziju aplikacije u `.next` folderu.

---

## 🌐 Korak 7: Pokretanje aplikacije

### Testiranje (development mode)

```bash
bun run dev
```

Aplikacija će biti dostupna na `http://server-ip:3000`

### Produkcija

```bash
bun run start
```

Aplikacija će biti dostupna na `http://server-ip:3002`

**NAPOMENA**: Port 3002 je konfigurisan u `package.json` za produkciju.

---

## 🛡️ Korak 8: Firewall konfiguracija

Otvorimo potrebne portove:

```bash
# Ako koristiš UFW firewall
sudo ufw allow 3002/tcp
sudo ufw allow 22/tcp  # SSH - VAŽNO!
sudo ufw enable
sudo ufw status
```

---

## 🔄 Korak 9: PM2 Process Manager (opciono ali preporučeno)

PM2 održava aplikaciju pokrenutu i automatski je restartuje ako se server restartuje:

```bash
# Instaliraj PM2 globalno
sudo npm install -g pm2

# Startuj aplikaciju sa PM2
cd ~/web-admin
pm2 start "bun run start" --name water-admin

# Sačuvaj PM2 procese
pm2 save

# Automatski startuj PM2 na boot-u
pm2 startup
# KOPIRAJ I IZVRŠI KOMANDU KOJU PM2 ISPIŠE!

# Proveri status
pm2 status
pm2 logs water-admin
```

Korisne PM2 komande:

```bash
pm2 stop water-admin      # Zaustavi
pm2 restart water-admin   # Restartuj
pm2 delete water-admin    # Obriši iz PM2
pm2 logs water-admin      # Prikazi logove
pm2 monit                 # Real-time monitoring
```

---

## 🌍 Korak 10: Nginx Reverse Proxy (opciono)

Ako želiš da aplikacija bude dostupna na portu 80 (HTTP) ili 443 (HTTPS):

### Instalacija Nginx

```bash
sudo apt install -y nginx
```

### Konfiguracija

```bash
sudo nano /etc/nginx/sites-available/water-admin
```

Dodaj sledeću konfiguraciju:

```nginx
server {
    listen 80;
    server_name server-ip-ili-domen;

    location / {
        proxy_pass http://localhost:3002;
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

Aktiviraj konfiguraciju:

```bash
sudo ln -s /etc/nginx/sites-available/water-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Otvori port 80:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # Za HTTPS kasnije
```

Sada možeš pristupiti na `http://server-ip` bez porta!

---

## 🔒 Korak 11: SSL/HTTPS sa Let's Encrypt (opciono)

Ako imaš domen (npr. `admin.lafantana.com`):

```bash
# Instaliraj Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dobij SSL sertifikat
sudo certbot --nginx -d admin.lafantana.com

# Auto-renewal je automatski konfigurisan
sudo certbot renew --dry-run
```

---

## 📱 Korak 12: Povezivanje sa mobilnom aplikacijom

### Pronađi IP adresu servera

```bash
hostname -I
# ili
ip addr show
```

### U mobilnoj aplikaciji

1. Prijavi se kao **admin** (admin/admin123)
2. Idi na **Profil → Settings** (ikona zupčanika)
3. Unesi **Admin Panel URL**:
   - Sa portom: `http://192.168.1.100:3002`
   - Sa Nginx: `http://192.168.1.100`
   - Sa domenom: `https://admin.lafantana.com`
4. Klikni **"Sačuvaj"**
5. Klikni **"Testiraj konekciju"**
6. Ako je OK, klikni **"Sinhronizuj sada"**

---

## ✅ Verifikacija instalacije

### Proveri da li radi

```bash
# Proveri da li port sluša
sudo netstat -tlnp | grep 3002

# Ili sa ss
ss -tlnp | grep 3002

# Proveri logove
pm2 logs water-admin

# Test HTTP zahtev
curl http://localhost:3002
```

### Testiranje u browseru

1. Otvori browser
2. Idi na `http://server-ip:3002`
3. Prijavljivanje:
   - Username: `admin`
   - Password: `admin123`

Ako vidiš login stranicu - **INSTALACIJA USPEŠNA!** 🎉

---

## 🐛 Troubleshooting

### Problem: "bun: command not found"

```bash
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Problem: Port 3002 je zauzet

```bash
# Proveri šta koristi port
sudo lsof -i :3002

# Ubij proces
sudo kill -9 PID

# Ili promeni port u package.json
nano package.json
# Promeni: "start": "next start -p 3002" u drugi port
```

### Problem: "Cannot connect" iz mobilne aplikacije

1. Proveri firewall:
```bash
sudo ufw status
sudo ufw allow 3002/tcp
```

2. Proveri da li server radi:
```bash
pm2 status
curl http://localhost:3002
```

3. **VAŽNO**: Ne koristi `localhost` u mobilnoj aplikaciji! Koristi IP adresu!

### Problem: Build error

```bash
# Očisti cache i rebuild
cd ~/web-admin
rm -rf .next node_modules
bun install
bun run build
```

### Problem: PM2 ne startuje na boot-u

```bash
pm2 unstartup
pm2 startup
# Kopiraj i izvrši komandu koju PM2 ispiše
pm2 save
```

---

## 📊 Monitoring i održavanje

### Logovi

```bash
# PM2 logovi
pm2 logs water-admin

# Nginx logovi
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restartovanje

```bash
# Restartuj aplikaciju
pm2 restart water-admin

# Restartuj Nginx
sudo systemctl restart nginx
```

### Ažuriranje aplikacije

```bash
cd ~/web-admin

# Povuci nove izmene (ako koristiš Git)
git pull

# Rebuild
bun install
bun run build

# Restartuj
pm2 restart water-admin
```

---

## 🔐 Sigurnost

### Promeni default admin lozinku

Default nalog: `admin/admin123` - **OBAVEZNO PROMENI!**

Ovo menja u mobilnoj aplikaciji:
1. Prijavi se kao admin
2. Idi na **Korisnici**
3. Nađi **admin** korisnika
4. Klikni **Izmeni**
5. Unesi novu lozinku

### Dodatne sigurnosne mere

```bash
# Omogući automatske sigurnosne ažuriraje
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Konfiguriši SSH (onemogući root login)
sudo nano /etc/ssh/sshd_config
# Promeni: PermitRootLogin no
sudo systemctl restart sshd
```

---

## 📞 Login kredencijali

### Web Admin Panel

- **URL**: `http://server-ip:3002`
- **Username**: `admin`
- **Password**: `admin123`

### Demo korisnici (iz mobilne app)

1. Super Admin: `admin` / `admin123`
2. Serviser 1: `marko` / `marko123`
3. Serviser 2: `jovan` / `jovan123`

---

## 📚 Dodatni resursi

- Next.js dokumentacija: https://nextjs.org/docs
- Bun dokumentacija: https://bun.sh/docs
- PM2 dokumentacija: https://pm2.keymetrics.io/docs
- Nginx dokumentacija: https://nginx.org/en/docs

---

## ✨ Završeno!

Web Admin Panel je sada instaliran i radi na Ubuntu 22.04 serveru!

**Sledeći koraci:**
1. Promeni default admin lozinku
2. Poveži mobilnu aplikaciju sa serverom
3. Testiraj sinhronizaciju podataka
4. Napravi backup bazu podataka (AsyncStorage)

**Napomena o podacima:**
- Mobilna aplikacija koristi lokalno AsyncStorage
- Web panel prima podatke preko HTTP POST zahteva
- Podatke na web panelu čuva u memoriji (refresh briše sve)
- Za perzistentne podatke, implementiraj SQL/NoSQL bazu

---

**Napravljeno za La Fantana WHS projekat**
Verzija: 1.0
Datum: 2025

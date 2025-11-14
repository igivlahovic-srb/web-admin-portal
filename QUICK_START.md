# 🚀 BRZI START - Deploy na Ubuntu u 5 minuta

## 📋 Šta ti treba:
- Ubuntu server sa SSH pristupom
- Root ili sudo pristup

---

## ⚡ AUTOMATSKI DEPLOYMENT (Preporučeno)

### Korak 1: Kopiraj folder na server
```bash
scp -r web-admin root@YOUR_SERVER_IP:/root/
```
Zameni `YOUR_SERVER_IP` sa IP adresom tvog servera (npr. `192.168.1.100`)

### Korak 2: Konektuj se i pokreni skriptu
```bash
ssh root@YOUR_SERVER_IP
cd /root/web-admin
sudo bash DEPLOY_TO_UBUNTU.sh
```

**To je to!** ✅

Portal će biti dostupan na:
- **URL:** `https://admin.lafantanasrb.local`
- **Username:** `admin`
- **Password:** `admin123`

Script automatski instalira i podešava:
- ✅ Node.js 20.x LTS
- ✅ Bun runtime
- ✅ Nginx reverse proxy sa SSL
- ✅ PM2 process manager
- ✅ Self-signed SSL certifikat (10 godina)
- ✅ Automatski start pri boot-u
- ✅ Firewall konfiguraciju
- ✅ Production build

---

## 🌐 Kako pristupiti sa drugih računara?

### Na tvom računaru (Windows):

1. Otvori Notepad **kao Administrator**
2. Otvori fajl: `C:\Windows\System32\drivers\etc\hosts`
3. Na kraj dodaj liniju:
   ```
   192.168.1.100    admin.lafantanasrb.local
   ```
   (Zameni `192.168.1.100` sa IP-jem tvog servera)
4. Sačuvaj fajl
5. Otvori browser: `https://admin.lafantanasrb.local`

### Na Linux/Mac:
```bash
sudo nano /etc/hosts
```
Dodaj:
```
192.168.1.100    admin.lafantanasrb.local
```

---

## 🔧 Osnovne komande nakon instalacije

### Proveri status:
```bash
pm2 status
```

### Vidi logove:
```bash
pm2 logs lafantana-whs-admin
```

### Restartuj portal:
```bash
pm2 restart lafantana-whs-admin
```

### Zaustavi portal:
```bash
pm2 stop lafantana-whs-admin
```

### Nginx komande:
```bash
# Status
sudo systemctl status nginx

# Restartuj
sudo systemctl restart nginx

# Logovi
sudo tail -f /var/log/nginx/lafantana-admin-access.log
```

---

## 📱 SSL Upozorenje u browser-u?

Browser će pokazati upozorenje jer koristimo self-signed SSL certifikat. To je normalno!

**Opcija 1:** Klikni "Advanced" → "Proceed to site" (svaki put)

**Opcija 2:** Instaliraj certifikat (jednom):

```bash
# Preuzmi sa servera
scp root@YOUR_SERVER_IP:/etc/nginx/ssl/lafantana-whs-admin.crt ./

# Na Windows: double-click i instaliraj u "Trusted Root"
# Na Linux:
sudo cp lafantana-whs-admin.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

---

## 🔄 Kako da update-ujem portal?

```bash
# 1. Kopiraj nove fajlove
scp -r web-admin root@YOUR_SERVER_IP:/root/

# 2. SSH i redeploy
ssh root@YOUR_SERVER_IP
cd /root/web-admin
sudo bash DEPLOY_TO_UBUNTU.sh
```

---

## 🐛 Nešto ne radi?

### Problem: Portal ne radi (502 greška)
```bash
# Proveri status
pm2 status

# Restartuj
pm2 restart lafantana-whs-admin

# Vidi šta je problem
pm2 logs lafantana-whs-admin
```

### Problem: Ne mogu da pristupim sa drugog računara
```bash
# Proveri firewall
sudo ufw status

# Otvori portove ako treba
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Problem: "Connection refused"
```bash
# Proveri da li nginx radi
sudo systemctl status nginx

# Pokreni nginx ako ne radi
sudo systemctl start nginx
```

---

## ✅ Gotovo!

Web admin portal je sada instaliran i radi profesionalno preko nginx-a sa:
- ✅ HTTPS enkripcijom
- ✅ Automatski start pri boot-u (PM2)
- ✅ Production build (brz i optimizovan)
- ✅ Nginx reverse proxy
- ✅ Logging sistem

**Za detaljne instrukcije, pogledaj:** `UBUNTU_DEPLOYMENT_GUIDE.md`

---

**Portal:** La Fantana WHS Admin
**Verzija:** 2.1.0

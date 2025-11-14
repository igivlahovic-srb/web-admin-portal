# Web Admin Panel - Dokumentacija

Pregled svih instalacionih dokumenata za La Fantana WHS Web Admin Panel.

---

## 📚 Instalacioni dokumenti

### 1. **UBUNTU_INSTALL.md** 📖
**Kompletan vodič za instalaciju na Ubuntu 22.04**

- Detaljan korak-po-korak vodič
- Objašnjenja za svaki korak
- Troubleshooting sekcija
- Network konfiguracija
- SSL/HTTPS setup sa Let's Encrypt
- Sigurnosne preporuke

**Za koga:** Početnici i oni koji žele detaljno objašnjenje.

---

### 2. **QUICK_START.md** ⚡
**Brza instalacija za iskusne korisnike**

- Koncizne komande bez objašnjenja
- Automatska i manualna instalacija
- PM2 i Nginx setup
- Osnovni troubleshooting

**Za koga:** Iskusni system administratori i DevOps inženjeri.

---

### 3. **install-ubuntu.sh** 🤖
**Automatski instalacioni script**

Interaktivni Bash script koji automatski:
- Ažurira sistem
- Instalira Node.js 20.x
- Instalira Bun
- Instalira npm pakete
- Pravi production build
- Konfiguriše firewall (UFW)
- Instalira PM2 (opciono)
- Instalira Nginx (opciono)
- Prikazuje finalne instrukcije

**Kako koristiti:**
```bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

**Za koga:** Svi korisnici - najbrži i najsigurniji način instalacije.

---

### 4. **INSTALL_CHECKLIST.md** ✅
**Instalaciona checklist lista**

- Pre-instalacione provere
- Checklist za automatsku instalaciju
- Checklist za manuelnu instalaciju
- Verifikacione korake
- Post-instalacione zadatke
- Tabela čestih grešaka

**Za koga:** Korisno tokom instalacije za praćenje progresa.

---

### 5. **SYSTEMD_SERVICE.md** ⚙️
**Alternativa za PM2 - systemd service**

- Kako kreirati systemd service
- Upravljanje servisom
- Prednosti systemd vs PM2
- Monitoring i logging
- Troubleshooting

**Za koga:** Korisnici koji preferiraju native Linux rešenja umesto PM2.

---

### 6. **README.md** 📘
**Glavni dokument web admin panela**

- Pregled funkcionalnosti
- Kako pokrenuti (development i production)
- Dijagnostika problema
- Sinhronizacija sa mobilnom aplikacijom
- API endpoints
- Network pristup

**Za koga:** Svi korisnici - početna tačka.

---

## 🎯 Koji dokument da koristim?

### Novi korisnik (nikad nisam instalirao ništa slično):
1. **README.md** - Prvo pročitaj ovo
2. **install-ubuntu.sh** - Pokreni script
3. **INSTALL_CHECKLIST.md** - Prati progress
4. **UBUNTU_INSTALL.md** - Ako nešto nije jasno

### Iskusan Linux korisnik:
1. **QUICK_START.md** - Brze komande
2. **install-ubuntu.sh** - Ili automatski script

### DevOps / System Administrator:
1. **QUICK_START.md** - Komande
2. **SYSTEMD_SERVICE.md** - Za systemd umesto PM2

### Ima problema tokom instalacije:
1. **UBUNTU_INSTALL.md** → Troubleshooting sekcija
2. **INSTALL_CHECKLIST.md** → Proveri šta fali

---

## 📋 Instalacioni proces

```
1. Prebaci web-admin folder na server
   └─> scp, git clone, ili manual upload

2. Izbor instalacije:
   ├─> AUTOMATSKA (preporučeno)
   │   └─> ./install-ubuntu.sh
   │
   └─> MANUALNA
       ├─> QUICK_START.md (iskusni)
       └─> UBUNTU_INSTALL.md (detaljno)

3. Verifikacija
   └─> INSTALL_CHECKLIST.md

4. Opciono: systemd umesto PM2
   └─> SYSTEMD_SERVICE.md

5. Povezivanje sa mobilnom aplikacijom
   └─> README.md → Sinhronizacija
```

---

## 🔗 Dodatni resursi

### U projektu:
- `diagnose.sh` / `diagnose.bat` - Dijagnostika konekcije
- `package.json` - npm scripts i zavisnosti
- `next.config.js` - Next.js konfiguracija

### Web resursi:
- Next.js: https://nextjs.org/docs
- Bun: https://bun.sh/docs
- PM2: https://pm2.keymetrics.io
- Nginx: https://nginx.org/en/docs
- Ubuntu: https://ubuntu.com/server/docs

---

## 🆘 Pomoć i podrška

### Problem sa instalacijom?
1. Proveri **UBUNTU_INSTALL.md** → Troubleshooting
2. Pogledaj **INSTALL_CHECKLIST.md** → Česte greške
3. Proveri logove:
   - PM2: `pm2 logs water-admin`
   - Systemd: `sudo journalctl -u water-admin -f`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

### Problem sa konekcijom?
1. Pokreni dijagnostiku: `./diagnose.sh`
2. Proveri **README.md** → Česte greške tabela
3. Verifikuj IP adresu i port

---

## 📊 Brza referenca

### Komande za PM2:
```bash
pm2 status                  # Status
pm2 logs water-admin        # Logovi
pm2 restart water-admin     # Restart
pm2 stop water-admin        # Stop
pm2 monit                   # Monitoring
```

### Komande za systemd:
```bash
sudo systemctl status water-admin      # Status
sudo journalctl -u water-admin -f      # Logovi
sudo systemctl restart water-admin     # Restart
sudo systemctl stop water-admin        # Stop
```

### Komande za Nginx:
```bash
sudo systemctl status nginx            # Status
sudo nginx -t                          # Test config
sudo systemctl restart nginx           # Restart
sudo tail -f /var/log/nginx/error.log  # Error log
```

### Provera portova:
```bash
sudo ss -tlnp | grep 3002              # Port 3002
sudo lsof -i :3002                     # Šta koristi port
curl http://localhost:3002             # HTTP test
```

---

## 🎓 Naučene lekcije

### ✅ Najbolje prakse:
- Koristi automatski `install-ubuntu.sh` script
- Postavi PM2 ili systemd za auto-restart
- Koristi Nginx kao reverse proxy
- Otvori samo potrebne portove u firewall-u
- Koristi IP adresu (NE localhost) za mobilnu app
- Promeni default admin lozinku!

### ❌ Česte greške:
- Korišćenje localhost umesto IP adrese
- Zaboravljanje da otvore port u firewall-u
- Ne pokretanje web panela pre testiranja
- Različite WiFi mreže (telefon vs računar)
- Ne čuvanje PM2 procesa (`pm2 save`)
- Ne postavljanje PM2 startup

---

## 📞 Brzi kontakt podaci

**Default login:**
- URL: `http://server-ip:3002`
- Username: `admin`
- Password: `admin123`

**Portovi:**
- Development: 3000
- Production: 3002
- HTTP (Nginx): 80
- HTTPS (SSL): 443

**Važne lokacije:**
- Web admin: `/home/user/web-admin`
- PM2 config: `~/.pm2`
- Nginx config: `/etc/nginx/sites-available/water-admin`
- Systemd service: `/etc/systemd/system/water-admin.service`
- Logovi: `pm2 logs` ili `journalctl -u water-admin`

---

**La Fantana WHS - Web Admin Panel**
Verzija: 1.0
Platforma: Ubuntu 22.04 LTS
Tech Stack: Next.js 15 + React 18 + TypeScript + Bun

# Ubuntu 22.04 - Instalaciona Checklist

Brza provera pre i tokom instalacije Web Admin Panela.

---

## ✅ Pre instalacije

- [ ] Fresh Ubuntu 22.04 server instaliran
- [ ] Root ili sudo pristup
- [ ] Minimalno 1GB RAM
- [ ] Internet konekcija aktivna
- [ ] SSH pristup serveru (ako je remote)
- [ ] Web-admin folder prebačen na server

---

## ✅ Provera sistema

```bash
# Proveri verziju Ubuntu-a
lsb_release -a

# Proveri RAM
free -h

# Proveri disk prostor
df -h

# Proveri internet konekciju
ping -c 3 google.com

# Proveri dostupne portove
sudo ss -tlnp | grep -E ':(3002|80|443)'
```

---

## ✅ Automatska instalacija (install-ubuntu.sh)

- [ ] Script prebačen na server
- [ ] `chmod +x install-ubuntu.sh` izvršeno
- [ ] `./install-ubuntu.sh` pokrenut
- [ ] Node.js instaliran i radi (`node --version`)
- [ ] Bun instaliran i radi (`bun --version`)
- [ ] Npm paketi instalirani (`ls node_modules`)
- [ ] Build uspešno kreiran (`ls .next`)
- [ ] Firewall konfigurisan (port 3002 otvoren)
- [ ] PM2 instaliran (opciono)
- [ ] Nginx instaliran (opciono)

---

## ✅ Manualna instalacija (korak-po-korak)

### Sistem
- [ ] `sudo apt update` izvršeno
- [ ] `sudo apt upgrade -y` izvršeno

### Node.js
- [ ] NodeSource repository dodat
- [ ] Node.js 20.x instaliran
- [ ] `node --version` prikazuje v20.x.x
- [ ] `npm --version` radi

### Bun
- [ ] Bun instaliran (`curl -fsSL https://bun.sh/install | bash`)
- [ ] PATH ažuriran (`.bashrc`)
- [ ] `source ~/.bashrc` izvršeno
- [ ] `bun --version` radi

### Aplikacija
- [ ] `cd ~/web-admin` uspešno
- [ ] `bun install` uspešno (bez grešaka)
- [ ] `bun run build` uspešno (.next folder kreiran)
- [ ] `bun run start` pokrenut

### Firewall (UFW)
- [ ] Port 3002 otvoren (`sudo ufw allow 3002/tcp`)
- [ ] Port 22 otvoren za SSH (`sudo ufw allow 22/tcp`)
- [ ] UFW aktivan (`sudo ufw enable`)
- [ ] Status proveren (`sudo ufw status`)

### PM2 (opciono)
- [ ] PM2 instaliran (`sudo npm install -g pm2`)
- [ ] Aplikacija startovana (`pm2 start "bun run start" --name water-admin`)
- [ ] Procesi sačuvani (`pm2 save`)
- [ ] Auto-start konfigurisan (`pm2 startup`)
- [ ] Status proveren (`pm2 status`)

### Nginx (opciono)
- [ ] Nginx instaliran (`sudo apt install -y nginx`)
- [ ] Config fajl kreiran (`/etc/nginx/sites-available/water-admin`)
- [ ] Symbolic link napravljen (`/etc/nginx/sites-enabled/water-admin`)
- [ ] Nginx test prošao (`sudo nginx -t`)
- [ ] Nginx restartovan (`sudo systemctl restart nginx`)
- [ ] Port 80 otvoren (`sudo ufw allow 80/tcp`)
- [ ] Port 443 otvoren (`sudo ufw allow 443/tcp`)

---

## ✅ Verifikacija

### Provera servisa
- [ ] Port 3002 sluša: `sudo ss -tlnp | grep 3002`
- [ ] HTTP zahtev radi: `curl http://localhost:3002`
- [ ] Login stranica se učitava u browseru
- [ ] PM2 status je "online" (ako se koristi)
- [ ] Nginx status je "active" (ako se koristi)

### Testiranje prijave
- [ ] Browser otvoren na `http://server-ip:3002`
- [ ] Login forma vidljiva
- [ ] Prijava sa admin/admin123 uspešna
- [ ] Dashboard se prikazuje

### Network test
- [ ] Server IP adresa utvrđena (`hostname -I`)
- [ ] Pristup sa drugog računara u istoj mreži radi
- [ ] Firewall ne blokira pristup

---

## ✅ Povezivanje mobilne aplikacije

- [ ] Web admin panel radi i dostupan je
- [ ] Server IP adresa poznata
- [ ] Mobilna aplikacija otvorena
- [ ] Prijavljen kao admin (admin/admin123)
- [ ] Profil → Settings otvoren
- [ ] URL unet: `http://SERVER-IP:3002`
- [ ] "Sačuvaj" kliknuto
- [ ] "Testiraj konekciju" uspešan
- [ ] "Sinhronizuj sada" uspešno
- [ ] Podaci vidljivi na web panelu

---

## ✅ Post-instalacija

### Sigurnost
- [ ] Default admin lozinka promenjena
- [ ] SSH konfigurisan (root login onemogućen)
- [ ] Automatski security update omogućen
- [ ] Firewall pravilno konfigurisan

### Backup
- [ ] Backup procedura definisana
- [ ] Backup lokacija određena
- [ ] Automatski backup scheduling (opciono)

### Monitoring
- [ ] PM2 monitoring radi (`pm2 monit`)
- [ ] Logovi dostupni (`pm2 logs water-admin`)
- [ ] Nginx logovi dostupni (`/var/log/nginx/`)

### Dokumentacija
- [ ] Login kredencijali dokumentovani
- [ ] Server IP adresa dokumentovana
- [ ] Održavanje procedura dokumentovane

---

## ✅ Česte greške i rešenja

| Problem | Provera | Rešenje |
|---------|---------|---------|
| `bun: command not found` | `echo $PATH` | Dodaj u PATH ili `source ~/.bashrc` |
| Port 3002 zauzet | `sudo lsof -i :3002` | Ubij proces ili promeni port |
| Build error | `ls node_modules` | `rm -rf node_modules && bun install` |
| Network request failed | `curl localhost:3002` | Proveri da li server radi |
| Firewall blokira | `sudo ufw status` | `sudo ufw allow 3002/tcp` |
| PM2 ne radi | `pm2 list` | `pm2 restart water-admin` |
| Nginx error | `sudo nginx -t` | Proveri config sintaksu |

---

## 📞 Važni podaci

**Server info:**
- IP adresa: `___________________`
- SSH port: `22` (default)
- Web panel port: `3002` (default production)

**Login kredencijali:**
- Username: `admin`
- Password: `admin123` (OBAVEZNO PROMENI!)

**Portovi:**
- 22 - SSH
- 3000 - Development mode
- 3002 - Production mode
- 80 - HTTP (sa Nginx-om)
- 443 - HTTPS (sa SSL-om)

**Korisni linkovi:**
- Detaljne instrukcije: `web-admin/UBUNTU_INSTALL.md`
- Brzi vodič: `web-admin/QUICK_START.md`
- Web admin README: `web-admin/README.md`

---

## 🎉 Instalacija kompletna!

Ako su svi stavke označene ✅, instalacija je uspešna i web admin panel je spreman za korišćenje!

**Sledeći koraci:**
1. Promeni default lozinku
2. Napravi backup proceduru
3. Testiraj sinhronizaciju sa mobilnom aplikacijom
4. Dokumentuj sve važne informacije

---

**La Fantana WHS - Web Admin Panel**
Verzija: 1.0
Datum instalacije: _________________
Instalirao: _________________

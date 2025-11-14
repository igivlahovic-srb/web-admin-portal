# 🚀 START HERE - Brzi vodič

Dobrodošli na instalaciju **La Fantana WHS Web Admin Panel** na Ubuntu 22.04!

---

## ⚡ TL;DR - Super brzo (2 minuta)

```bash
# 1. Prebaci web-admin folder na server
scp -r web-admin/ user@server-ip:/home/user/

# 2. SSH na server
ssh user@server-ip

# 3. Uđi u folder i pokreni script
cd ~/web-admin
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

Script će te provesti kroz sve automatski. Gotovo! 🎉

---

## 📖 Detaljniji pristup (10 minuta)

### Korak 1: Izaberi metod instalacije

**Novi sam u Linux-u:**
→ Koristi automatski script: `./install-ubuntu.sh`
→ Prati: [INSTALL_CHECKLIST.md](./INSTALL_CHECKLIST.md)

**Iskusan sam sa Linux-om:**
→ Pogledaj: [QUICK_START.md](./QUICK_START.md)

**Želim sve detalje:**
→ Čitaj: [UBUNTU_INSTALL.md](./UBUNTU_INSTALL.md)

### Korak 2: Pokreni instalaciju

```bash
cd ~/web-admin
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

### Korak 3: Verifikuj

```bash
# Proveri da li radi
curl http://localhost:3002

# Otvori u browser-u
http://YOUR-SERVER-IP:3002
```

Login: `admin` / `admin123`

### Korak 4: Poveži mobilnu aplikaciju

1. U mobilnoj app: **Profil → Settings**
2. Unesi URL: `http://YOUR-SERVER-IP:3002`
3. **Sačuvaj** → **Testiraj konekciju** → **Sinhronizuj**

Gotovo! 🎉

---

## 📚 Sve instalacione dokumente pogledaj ovde:

**[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Centralni indeks svih dokumenata

---

## 🆘 Problem?

1. Proveri: [UBUNTU_INSTALL.md](./UBUNTU_INSTALL.md) → Troubleshooting sekcija
2. Pokreni dijagnostiku: `./diagnose.sh`
3. Proveri checklist: [INSTALL_CHECKLIST.md](./INSTALL_CHECKLIST.md)

---

## 🎯 Šta ćeš dobiti?

- ✅ Web admin panel na `http://server-ip:3002`
- ✅ Automatski startup (PM2 ili systemd)
- ✅ Firewall konfigurisan
- ✅ Production build optimizovan
- ✅ Nginx reverse proxy (opciono)
- ✅ HTTPS ready (opciono)

---

## ⏱️ Koliko traje?

- **Automatska instalacija**: 5-10 minuta
- **Manualna instalacija**: 15-20 minuta
- **Sa Nginx i SSL**: 20-30 minuta

---

## 🔐 Važno!

**Default login:**
- Username: `admin`
- Password: `admin123`

⚠️ **OBAVEZNO promeni lozinku nakon prve prijave!**

---

**La Fantana WHS - Web Admin Panel**

🔗 **Sledeći korak:** [UBUNTU_INSTALL.md](./UBUNTU_INSTALL.md) ili `./install-ubuntu.sh`

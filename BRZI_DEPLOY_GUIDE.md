# ⚡ BRZO UPUTSTVO - DEPLOYMENT WEB PORTALA

## 🎯 Za Iskusne Korisnike

```bash
# Jedan komanda deployment
ssh root@YOUR_SERVER_IP
bash <(curl -s https://raw.githubusercontent.com/igivlahovic-srb/web-admin-portal/main/DEPLOY_WEB_PORTAL_UBUNTU.sh)
```

## 📋 Šta Script Radi

1. ✅ Instalira Node.js 20.x
2. ✅ Instalira Bun
3. ✅ Instalira Git
4. ✅ Instalira PM2
5. ✅ Klonira web portal sa GitHub-a
6. ✅ Instalira dependencies
7. ✅ Build-uje Next.js aplikaciju
8. ✅ Pokreće sa PM2
9. ✅ Konfiguriše Nginx
10. ✅ Konfiguriše Firewall

## 🚀 Alternativa: SCP Script

```bash
# Sa vašeg računara
scp DEPLOY_WEB_PORTAL_UBUNTU.sh root@YOUR_SERVER_IP:/root/
ssh root@YOUR_SERVER_IP 'chmod +x /root/DEPLOY_WEB_PORTAL_UBUNTU.sh && sudo bash /root/DEPLOY_WEB_PORTAL_UBUNTU.sh'
```

## 🔑 Login

- URL: `http://YOUR_SERVER_IP`
- Username: `admin`
- Password: `admin123`

## 📱 Mobilna App Konekcija

1. App → Profil → Settings
2. URL: `http://YOUR_SERVER_IP:3000`
3. Testiraj konekciju
4. Sinhronizuj

## 🔧 Korisne Komande

```bash
# Status
pm2 status

# Logovi
pm2 logs web-admin-portal

# Restart
pm2 restart web-admin-portal

# Update sa GitHub
cd ~/web-admin-portal
git pull && bun install && bun run build && pm2 restart web-admin-portal

# Nginx restart
sudo systemctl restart nginx
```

## 🐛 Troubleshooting

| Problem | Rešenje |
|---------|---------|
| Port zauzet | `sudo lsof -i :3000` → `sudo kill -9 PID` |
| PM2 ne radi | `pm2 logs web-admin-portal` |
| Nginx 502 | `pm2 restart web-admin-portal` |
| Network error u app | Koristi pravu IP, ne localhost |

## 📊 Minimalni Resursi

- 2GB RAM
- 10GB Disk
- Ubuntu 22.04+

## 🔒 SSL (Opciono)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.lafantanasrb.com
```

---

**Detaljno uputstvo:** `DEPLOYMENT_UPUTSTVO.md`

# La Fantana WHS - Quick Deployment Guide

## 🎯 You are here (Vibecode Sandbox)
We've prepared everything. Now you need to deploy to your Ubuntu server.

---

## 📦 What's Ready

All files are prepared in `/home/user/workspace/`:

```
✅ nginx/lafantana-whs-full.conf      - Complete Nginx config
✅ setup-nginx-full.sh                - Automated setup script
✅ build-apk.sh                       - Build APK script
✅ deploy-apk-nginx.sh                - Deploy script
✅ NGINX_COMPLETE_GUIDE.md            - Full documentation
✅ NGINX_ARCHITECTURE_PROPOSAL.md     - Architecture overview
```

---

## 🚀 Deployment Steps (Your Ubuntu Server)

### Option 1: Automatic (Recommended - 5 minutes)

**On your Ubuntu server**, run:

```bash
# 1. Navigate to workspace
cd /home/user/workspace

# 2. Run setup script
sudo ./setup-nginx-full.sh
```

The script will:
- ✅ Install Nginx
- ✅ Generate SSL certificate (10 years)
- ✅ Create directories
- ✅ Configure everything
- ✅ Start Nginx

**Done!** System is live.

---

### Option 2: Manual (Step-by-step)

If automatic script doesn't work, run these commands **on your Ubuntu server**:

#### Step 1: Install Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx apache2-utils openssl
```

#### Step 2: Create directories
```bash
sudo mkdir -p /var/www/lafantana-whs/{apk,api,backups,web,logs}
sudo mkdir -p /etc/nginx/ssl
```

#### Step 3: Generate SSL certificate
```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/lafantana-whs.key \
    -out /etc/nginx/ssl/lafantana-whs.crt \
    -subj "/C=RS/ST=Serbia/L=Belgrade/O=La Fantana/OU=IT/CN=appserver.lafantanasrb.local" \
    -addext "subjectAltName=DNS:appserver.lafantanasrb.local,DNS:localhost,IP:127.0.0.1"

sudo chmod 600 /etc/nginx/ssl/lafantana-whs.key
sudo chmod 644 /etc/nginx/ssl/lafantana-whs.crt
```

#### Step 4: Install Nginx config
```bash
sudo cp nginx/lafantana-whs-full.conf /etc/nginx/sites-available/lafantana-whs
sudo ln -sf /etc/nginx/sites-available/lafantana-whs /etc/nginx/sites-enabled/lafantana-whs
sudo rm -f /etc/nginx/sites-enabled/default
```

#### Step 5: Create API endpoint
```bash
sudo bash -c 'cat > /var/www/lafantana-whs/api/mobile-app.json << EOF
{
  "success": true,
  "data": {
    "hasApk": false,
    "latestVersion": "2.1.0",
    "downloadUrl": null,
    "message": "No APK uploaded yet."
  }
}
EOF'
```

#### Step 6: Set permissions
```bash
sudo chown -R www-data:www-data /var/www/lafantana-whs
sudo chmod -R 755 /var/www/lafantana-whs
sudo chmod -R 777 /var/www/lafantana-whs/logs
```

#### Step 7: Create admin password
```bash
sudo htpasswd -c /etc/nginx/.htpasswd admin
# Enter password when prompted
```

#### Step 8: Start Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Step 9: Configure firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## ✅ Verification

After setup, test these URLs **on your server**:

```bash
# Health check
curl -k https://localhost/health

# API endpoint
curl -k https://localhost/api/mobile-app.json

# Nginx status
sudo systemctl status nginx
```

Expected output:
```
✓ Health check: OK
✓ API endpoint: {"success":true,"data":{...}}
✓ Nginx: active (running)
```

---

## 🌐 Access Points

After successful setup:

**Web Admin:**
```
https://appserver.lafantanasrb.local
```

**API:**
```
https://appserver.lafantanasrb.local/api/mobile-app.json
```

**Downloads:**
```
https://appserver.lafantanasrb.local/download/latest.apk
```

**Backups (admin only):**
```
https://appserver.lafantanasrb.local/backup/
Username: admin
Password: (what you set in Step 7)
```

---

## 📱 Next Steps After Nginx Setup

### 1. Start Web Admin Panel
```bash
cd /home/user/workspace/web-admin
bun install  # First time only
bun dev
```

Web admin runs on port 3000, proxied through Nginx.

### 2. Build & Deploy APK
```bash
cd /home/user/workspace

# Build APK (5-10 minutes)
./build-apk.sh

# Deploy to Nginx
./deploy-apk-nginx.sh
```

### 3. Install Certificate on Mobile Devices

**Download certificate:**
```
https://appserver.lafantanasrb.local/download/lafantana-whs.crt
```

**Android:**
- Settings → Security → Install from storage
- Select certificate file
- Name it "La Fantana Server"

**Done!** No more SSL warnings.

---

## 📊 Directory Layout (After Setup)

```
/var/www/lafantana-whs/
├── apk/                   ← APK files
├── api/                   ← API endpoints
│   └── mobile-app.json
├── backups/               ← Backup files
├── web/                   ← Static files
└── logs/                  ← App logs

/etc/nginx/
├── sites-available/lafantana-whs
├── sites-enabled/lafantana-whs → symlink
├── ssl/
│   ├── lafantana-whs.crt
│   └── lafantana-whs.key
└── .htpasswd
```

---

## 🛠️ Troubleshooting

### Nginx won't start
```bash
sudo nginx -t  # Test config
sudo journalctl -xe | grep nginx  # View errors
```

### Port already in use
```bash
sudo netstat -tulpn | grep :443
sudo systemctl stop apache2  # If Apache is running
```

### Permission denied
```bash
sudo chown -R www-data:www-data /var/www/lafantana-whs
```

### Can't access from mobile
1. Check firewall: `sudo ufw status`
2. Check Nginx: `sudo systemctl status nginx`
3. Test locally: `curl -k https://localhost/health`

---

## 📚 Documentation

Detailed guides in `/home/user/workspace/`:
- `NGINX_COMPLETE_GUIDE.md` - Full documentation
- `NGINX_ARCHITECTURE_PROPOSAL.md` - Architecture details
- `BUILD_INSTRUCTIONS.md` - APK build guide

---

## ✨ What You Get

After this setup:
✅ Professional HTTPS URLs (no port numbers)
✅ Self-signed SSL (10 years validity)
✅ Reverse proxy (web admin on port 3000)
✅ API endpoints for mobile app
✅ APK download system
✅ Backup system (password protected)
✅ Rate limiting & security headers
✅ Gzip compression & caching
✅ Enterprise-grade architecture

---

## 🎯 Summary

**Current location:** Vibecode Sandbox (no root access)
**What to do:** Run setup on your Ubuntu server

**Simplest way:**
```bash
ssh user@appserver.lafantanasrb.local
cd /home/user/workspace
sudo ./setup-nginx-full.sh
```

**Time required:** 5 minutes
**Result:** Professional production-ready system

---

Ready to proceed? Run the setup on your Ubuntu server! 🚀

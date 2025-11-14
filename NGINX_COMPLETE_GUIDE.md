# La Fantana WHS - Complete Nginx Deployment Guide

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet / Local Network                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │  Nginx (Port 443) │
                   │  Reverse Proxy    │
                   │  + SSL/TLS        │
                   └─────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
       │ Web Admin   │ │   API    │ │    APK     │
       │ Port 3000   │ │  Static  │ │   Static   │
       │ (proxied)   │ │  JSON    │ │   Files    │
       └─────────────┘ └──────────┘ └────────────┘
```

**Professional URLs:**
- `https://appserver.lafantanasrb.local/` → Web Admin Panel
- `https://appserver.lafantanasrb.local/api/mobile-app.json` → Version API
- `https://appserver.lafantanasrb.local/download/latest.apk` → Latest APK
- `https://appserver.lafantanasrb.local/backup/` → Backups (admin only)

---

## 🚀 Quick Start (10 Minutes)

### 1. Setup Nginx (One Time - 5 minutes)
```bash
cd /home/user/workspace
sudo ./setup-nginx-full.sh
```

This will:
- ✅ Install Nginx
- ✅ Generate self-signed SSL certificate (10 years)
- ✅ Create directory structure
- ✅ Configure reverse proxy
- ✅ Setup API endpoints
- ✅ Enable security features
- ✅ Configure firewall

### 2. Start Web Admin Panel
```bash
cd web-admin
bun install  # First time only
bun dev
```

Web admin runs on port 3000 (proxied through Nginx).

### 3. Build & Deploy APK (5 minutes)
```bash
cd /home/user/workspace
./build-apk.sh              # Build APK (5-10 min)
./deploy-apk-nginx.sh       # Deploy to Nginx
```

### 4. Access the system
```
Web Admin: https://appserver.lafantanasrb.local
Username: admin
Password: admin123
```

---

## 📁 Directory Structure

```
/var/www/lafantana-whs/
├── apk/                              ← APK files
│   ├── lafantana-whs-v2.1.0.apk
│   ├── lafantana-whs-v2.2.0.apk
│   ├── latest.apk → (symlink)
│   └── lafantana-whs.crt            ← SSL cert for mobile
│
├── api/                              ← API endpoints
│   └── mobile-app.json              ← Version info
│
├── backups/                          ← Backup files (admin only)
│   └── backup-2025-11-14.tar.gz
│
├── web/                              ← Static web files (optional)
│
└── logs/                             ← Application logs
```

**Nginx Files:**
```
/etc/nginx/
├── sites-available/lafantana-whs     ← Main config
├── sites-enabled/lafantana-whs       ← Symlink
├── ssl/
│   ├── lafantana-whs.crt            ← Certificate
│   └── lafantana-whs.key            ← Private key
└── .htpasswd                        ← Admin password
```

---

## 🔐 SSL Certificate (Self-Signed)

### Why Self-Signed is OK for Local Server

✅ **Perfect for internal/local networks**
- No external domain needed
- No renewal hassle (10 year validity)
- Free and instant
- Full encryption (same as paid certs)

❌ **Not for public internet**
- Browsers show warning
- Mobile devices need manual trust

### Installing Certificate on Mobile Devices

#### Android:
1. Download certificate:
   ```
   https://appserver.lafantanasrb.local/download/lafantana-whs.crt
   ```

2. Install certificate:
   - Settings → Security → Encryption & credentials
   - Install from storage
   - Select `lafantana-whs.crt`
   - Name it "La Fantana Server"

3. Done! No more warnings

#### iOS:
1. Download certificate via Safari
2. Settings → General → VPN & Device Management
3. Install profile
4. Settings → General → About → Certificate Trust Settings
5. Enable trust for "La Fantana Server"

### Certificate Details
- **Valid for**: 10 years (no renewal needed)
- **Algorithm**: RSA 2048-bit
- **Domain**: appserver.lafantanasrb.local
- **Location**: `/etc/nginx/ssl/lafantana-whs.crt`

---

## 🌐 API Endpoints

### Mobile App Version Check
```bash
curl -k https://appserver.lafantanasrb.local/api/mobile-app.json
```

Response:
```json
{
  "success": true,
  "data": {
    "hasApk": true,
    "latestVersion": "2.1.0",
    "downloadUrl": "https://appserver.lafantanasrb.local/download/lafantana-whs-v2.1.0.apk",
    "directDownloadUrl": "https://appserver.lafantanasrb.local/download/latest.apk",
    "certificateUrl": "https://appserver.lafantanasrb.local/download/lafantana-whs.crt",
    "fileSize": "45M",
    "releaseDate": "2025-11-14T12:30:00+00:00",
    "message": "Nova verzija dostupna za preuzimanje"
  }
}
```

### Health Check
```bash
curl -k https://appserver.lafantanasrb.local/health
```

---

## 🔧 Scripts Reference

### Setup & Deployment

| Script | Purpose | Duration |
|--------|---------|----------|
| `setup-nginx-full.sh` | Initial Nginx setup | 5 min |
| `build-apk.sh` | Build Android APK | 5-10 min |
| `deploy-apk-nginx.sh` | Deploy APK to Nginx | 1 min |
| `build-and-deploy.sh` | Build + Deploy (all-in-one) | 6-11 min |

### Daily Workflow

```bash
# 1. Make code changes in src/

# 2. Update version in app.json
vim app.json  # Change "version": "2.2.0"

# 3. Build and deploy
./build-and-deploy.sh

# Done! APK is live at:
# https://appserver.lafantanasrb.local/download/latest.apk
```

---

## 🔒 Security Features

### ✅ Implemented

1. **HTTPS/TLS Encryption**
   - TLS 1.2 and 1.3
   - Strong cipher suites
   - Perfect Forward Secrecy

2. **Security Headers**
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options (clickjacking protection)
   - X-Content-Type-Options (MIME sniffing protection)
   - X-XSS-Protection
   - Referrer-Policy

3. **Rate Limiting**
   - API: 30 requests/second
   - Downloads: 5 requests/second
   - General: 100 requests/second

4. **Access Control**
   - Backup area password protected
   - IP whitelisting option
   - Hidden files blocked
   - Config files blocked

5. **Best Practices**
   - Deny .htaccess, .env, backup files
   - Disable directory listing (except backups)
   - Secure file permissions
   - Separate log files

### Optional Hardening

1. **IP Whitelisting for Admin**
   ```nginx
   location /backup/ {
       allow 192.168.1.0/24;  # Your network
       deny all;
   }
   ```

2. **Fail2ban Integration**
   ```bash
   sudo apt-get install fail2ban
   # Blocks IPs after failed attempts
   ```

3. **ModSecurity WAF**
   ```bash
   sudo apt-get install libnginx-mod-security
   # Web Application Firewall
   ```

---

## 📊 Monitoring & Logging

### View Logs

```bash
# Access log (all requests)
sudo tail -f /var/log/nginx/lafantana-whs-access.log

# Error log
sudo tail -f /var/log/nginx/lafantana-whs-error.log

# Nginx status
curl -k https://localhost/nginx_status
```

### Log Format

Access log includes:
- IP address
- Timestamp
- Request method and URL
- Response status code
- Response size
- User agent
- Response time

---

## 🛠️ Troubleshooting

### Nginx won't start

```bash
# Test configuration
sudo nginx -t

# Check detailed errors
sudo journalctl -xe | grep nginx

# Check if port is already in use
sudo netstat -tulpn | grep :443
```

### Web admin not loading

```bash
# Check if web admin is running
curl http://localhost:3000

# Start web admin
cd web-admin && bun dev

# Check Nginx proxy
sudo tail -f /var/log/nginx/lafantana-whs-error.log
```

### SSL certificate errors

```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/lafantana-whs.crt -text -noout

# Check certificate expiry
openssl x509 -in /etc/nginx/ssl/lafantana-whs.crt -noout -dates

# Regenerate if needed
sudo ./setup-nginx-full.sh  # Will detect and skip if exists
```

### Mobile app can't connect

1. **Check network connectivity**
   ```bash
   ping appserver.lafantanasrb.local
   ```

2. **Check Nginx is running**
   ```bash
   sudo systemctl status nginx
   ```

3. **Test API manually**
   ```bash
   curl -k https://appserver.lafantanasrb.local/api/mobile-app.json
   ```

4. **Install certificate on mobile device** (see SSL section above)

### Downloads not working

```bash
# Check file exists
ls -lh /var/www/lafantana-whs/apk/

# Check permissions
sudo chown -R www-data:www-data /var/www/lafantana-whs/apk/
sudo chmod -R 644 /var/www/lafantana-whs/apk/*.apk

# Test download
curl -k -I https://appserver.lafantanasrb.local/download/latest.apk
```

---

## 🔄 Updates & Maintenance

### Update Nginx Configuration

```bash
# Edit config
sudo nano /etc/nginx/sites-available/lafantana-whs

# Test config
sudo nginx -t

# Apply changes
sudo systemctl reload nginx
```

### Update SSL Certificate (if expired)

```bash
cd /home/user/workspace
sudo rm /etc/nginx/ssl/lafantana-whs.*
sudo ./setup-nginx-full.sh
```

### Clean Old APK Versions

```bash
# Automatic (keeps last 5)
./deploy-apk-nginx.sh

# Manual
sudo rm /var/www/lafantana-whs/apk/lafantana-whs-v2.0.0.apk
```

### Backup Everything

```bash
# Backup web files
sudo tar -czf lafantana-backup-$(date +%Y%m%d).tar.gz \
  /var/www/lafantana-whs \
  /etc/nginx/sites-available/lafantana-whs \
  /etc/nginx/ssl/lafantana-whs.*

# Download backup
scp user@server:/path/to/backup.tar.gz ./
```

---

## 📈 Performance Optimization

### Enabled by Default

✅ **Gzip Compression** - 70% bandwidth reduction
✅ **HTTP/2** - Faster page loads
✅ **Static File Caching** - APK files cached 1 day
✅ **Connection Keepalive** - Reduced latency
✅ **Proxy Buffering** - Better throughput

### Optional: Enable Brotli Compression

```bash
sudo apt-get install nginx-module-brotli
# Edit nginx.conf to enable
```

### Optional: Add CDN (CloudFlare)

```bash
# Point domain DNS to CloudFlare
# CloudFlare will cache static files globally
# Free SSL certificate included
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Nginx installed and running
- [ ] SSL certificate installed on server
- [ ] SSL certificate installed on all mobile devices
- [ ] Web admin accessible via HTTPS
- [ ] API endpoint responding
- [ ] APK download working
- [ ] Firewall configured (ports 80, 443)
- [ ] Backup system tested
- [ ] Admin password set for /backup/
- [ ] Logs monitored
- [ ] Documentation reviewed

---

## 🆘 Support Commands

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload config (no downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View all logs
sudo tail -f /var/log/nginx/*.log

# Check disk usage
df -h /var/www/lafantana-whs

# Check Nginx version
nginx -v
```

---

## 📞 Summary

**What We Built:**
- Professional Nginx reverse proxy
- HTTPS with self-signed certificate (10 years)
- Web admin on clean URL (no port numbers)
- API endpoints for mobile app
- APK download system
- Backup system with authentication
- Enterprise-grade security
- Performance optimizations

**Benefits:**
- ✅ Professional URLs
- ✅ Full encryption (HTTPS)
- ✅ Single entry point
- ✅ Better security
- ✅ Faster performance
- ✅ Easier to scale
- ✅ Industry standard

**Time Investment:**
- Initial setup: 10 minutes
- Ongoing: Zero (automated)

---

**App**: La Fantana WHS - Servisni Modul
**Version**: 2.1.0
**Server**: Ubuntu + Nginx + Self-Signed SSL
**Domain**: appserver.lafantanasrb.local

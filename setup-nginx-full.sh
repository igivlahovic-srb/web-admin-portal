#!/bin/bash

echo "=========================================="
echo "La Fantana WHS - Complete Nginx Setup"
echo "Professional Production Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="lafantana-whs"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
SSL_DIR="/etc/nginx/ssl"
WORKSPACE="/home/user/workspace"
DOMAIN="appserver.lafantanasrb.local"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo -e "${BLUE}This script will setup:${NC}"
echo "  ✓ Nginx web server"
echo "  ✓ Self-signed SSL certificate"
echo "  ✓ Directory structure"
echo "  ✓ Web admin reverse proxy"
echo "  ✓ APK download system"
echo "  ✓ API endpoints"
echo "  ✓ Security configuration"
echo "  ✓ Backup system"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 1: Installing Nginx"
echo "=========================================="

if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

echo ""
echo "=========================================="
echo "STEP 2: Creating directory structure"
echo "=========================================="

mkdir -p "$APP_DIR"/{apk,api,backups,web,logs}
mkdir -p "$SSL_DIR"

echo -e "${GREEN}✓ Directories created:${NC}"
echo "  $APP_DIR/apk       - APK files"
echo "  $APP_DIR/api       - API endpoints"
echo "  $APP_DIR/backups   - Backup files"
echo "  $APP_DIR/web       - Static web files"
echo "  $APP_DIR/logs      - Application logs"

echo ""
echo "=========================================="
echo "STEP 3: Generating self-signed SSL certificate"
echo "=========================================="

if [ ! -f "$SSL_DIR/$APP_NAME.crt" ]; then
    echo "Generating self-signed certificate..."

    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$SSL_DIR/$APP_NAME.key" \
        -out "$SSL_DIR/$APP_NAME.crt" \
        -subj "/C=RS/ST=Serbia/L=Belgrade/O=La Fantana/OU=IT/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"

    chmod 600 "$SSL_DIR/$APP_NAME.key"
    chmod 644 "$SSL_DIR/$APP_NAME.crt"

    echo -e "${GREEN}✓ SSL certificate generated (valid for 10 years)${NC}"
    echo "  Certificate: $SSL_DIR/$APP_NAME.crt"
    echo "  Private key: $SSL_DIR/$APP_NAME.key"
else
    echo -e "${GREEN}✓ SSL certificate already exists${NC}"
fi

echo ""
echo "=========================================="
echo "STEP 4: Installing Nginx configuration"
echo "=========================================="

cp "$WORKSPACE/nginx/lafantana-whs-full.conf" "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/$APP_NAME

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "  Removed default site"
fi

echo -e "${GREEN}✓ Nginx configuration installed${NC}"

echo ""
echo "=========================================="
echo "STEP 5: Testing Nginx configuration"
echo "=========================================="

nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    echo "Please check the configuration and try again."
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 6: Creating API endpoints"
echo "=========================================="

# Create initial API response for mobile app version check
cat > "$APP_DIR/api/mobile-app.json" << 'EOF'
{
  "success": true,
  "data": {
    "hasApk": false,
    "latestVersion": "2.1.0",
    "downloadUrl": null,
    "message": "No APK uploaded yet. Build and deploy your first APK."
  }
}
EOF

echo -e "${GREEN}✓ API endpoints created${NC}"
echo "  $APP_DIR/api/mobile-app.json"

echo ""
echo "=========================================="
echo "STEP 7: Setting permissions"
echo "=========================================="

chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 777 "$APP_DIR/logs"  # Logs need write access

echo -e "${GREEN}✓ Permissions set${NC}"

echo ""
echo "=========================================="
echo "STEP 8: Creating admin authentication"
echo "=========================================="

if ! command -v htpasswd &> /dev/null; then
    echo "Installing apache2-utils for htpasswd..."
    apt-get install -y apache2-utils
fi

echo ""
echo "Create admin password for backup access:"
htpasswd -c /etc/nginx/.htpasswd admin

echo -e "${GREEN}✓ Admin authentication created${NC}"

echo ""
echo "=========================================="
echo "STEP 9: Configuring firewall"
echo "=========================================="

if command -v ufw &> /dev/null; then
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    echo -e "${GREEN}✓ Firewall rules added${NC}"
else
    echo -e "${YELLOW}⚠ UFW not found. Please configure firewall manually.${NC}"
fi

echo ""
echo "=========================================="
echo "STEP 10: Starting Nginx"
echo "=========================================="

systemctl restart nginx
systemctl enable nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx started successfully${NC}"
else
    echo -e "${RED}✗ Nginx failed to start${NC}"
    echo "Check logs: journalctl -xe"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 11: Final checks"
echo "=========================================="

echo "Checking Nginx status..."
systemctl status nginx --no-pager | head -10

echo ""
echo "Testing endpoints..."
curl -k -s https://localhost/health > /dev/null && echo -e "${GREEN}✓ Health check: OK${NC}" || echo -e "${RED}✗ Health check failed${NC}"
curl -k -s https://localhost/api/mobile-app.json > /dev/null && echo -e "${GREEN}✓ API endpoint: OK${NC}" || echo -e "${RED}✗ API endpoint failed${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✓✓✓ SETUP COMPLETE! ✓✓✓${NC}"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "  • Nginx: Running on ports 80 (HTTP) and 443 (HTTPS)"
echo "  • SSL: Self-signed certificate (valid for 10 years)"
echo "  • Web Admin: https://$DOMAIN (proxied from port 3000)"
echo "  • API: https://$DOMAIN/api/"
echo "  • Downloads: https://$DOMAIN/download/"
echo "  • Backups: https://$DOMAIN/backup/ (password protected)"
echo ""
echo "🔐 Security:"
echo "  • HTTPS with TLS 1.2/1.3"
echo "  • Rate limiting enabled"
echo "  • Security headers configured"
echo "  • Admin area password protected"
echo ""
echo "📁 Directories:"
echo "  • Config: $NGINX_CONF"
echo "  • Web root: $APP_DIR"
echo "  • SSL certs: $SSL_DIR"
echo "  • Logs: /var/log/nginx/lafantana-whs-*.log"
echo ""
echo "⚠️  IMPORTANT - Self-Signed Certificate:"
echo "  Mobile devices will show certificate warning on first access."
echo "  To trust the certificate on Android:"
echo "    1. Download certificate: https://$DOMAIN/download/lafantana-whs.crt"
echo "    2. Install in Settings → Security → Install from storage"
echo ""
echo "📝 Next steps:"
echo "  1. Start web admin panel: cd web-admin && bun dev"
echo "  2. Build APK: ./build-apk.sh"
echo "  3. Deploy APK: ./deploy-apk-nginx.sh"
echo "  4. Access web admin: https://$DOMAIN"
echo ""
echo "🔧 Useful commands:"
echo "  • Restart Nginx: sudo systemctl restart nginx"
echo "  • View logs: sudo tail -f /var/log/nginx/lafantana-whs-access.log"
echo "  • Test config: sudo nginx -t"
echo "  • Check status: sudo systemctl status nginx"
echo ""

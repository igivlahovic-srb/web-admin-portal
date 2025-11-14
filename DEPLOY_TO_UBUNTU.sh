#!/bin/bash
# =========================================
# La Fantana WHS - Web Admin Portal
# Ubuntu Production Deployment Script
# =========================================

set -e  # Exit on any error

echo "=========================================="
echo "🚀 La Fantana WHS - Web Admin Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="lafantana-whs-admin"
DEPLOY_DIR="/var/www/lafantana-admin"
NGINX_DOMAIN="admin.lafantanasrb.local"  # Change this to your domain
PORT=3000

echo -e "${BLUE}Step 1/8: Checking prerequisites...${NC}"
# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run as root (use sudo)${NC}"
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun not found. Installing...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx not found. Installing...${NC}"
    apt-get update
    apt-get install -y nginx
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

echo -e "${BLUE}Step 2/8: Creating deployment directory...${NC}"
mkdir -p $DEPLOY_DIR
echo -e "${GREEN}✅ Directory created: $DEPLOY_DIR${NC}"
echo ""

echo -e "${BLUE}Step 3/8: Copying application files...${NC}"
# Copy all files except node_modules and .next
rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  ./ $DEPLOY_DIR/

echo -e "${GREEN}✅ Files copied${NC}"
echo ""

echo -e "${BLUE}Step 4/8: Setting up environment variables...${NC}"
if [ ! -f "$DEPLOY_DIR/.env.local" ]; then
    cat > $DEPLOY_DIR/.env.local <<EOF
# Database Configuration
DB_SERVER=localhost
DB_NAME=lafantana_whs
DB_USER=admin
DB_PASSWORD=admin123
DB_PORT=1433

# Use SQLite by default (set to 'true' for MSSQL)
USE_MSSQL=false

# Production settings
NODE_ENV=production
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
else
    echo -e "${YELLOW}⚠ Environment file already exists, skipping...${NC}"
fi
echo ""

echo -e "${BLUE}Step 5/8: Installing dependencies and building...${NC}"
cd $DEPLOY_DIR
bun install --production
bun run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

echo -e "${BLUE}Step 6/8: Setting up PM2...${NC}"
# Stop existing PM2 process if running
pm2 delete $APP_NAME 2>/dev/null || true

# Start with PM2
pm2 start bun --name $APP_NAME -- start
pm2 save
pm2 startup

echo -e "${GREEN}✅ PM2 configured${NC}"
echo ""

echo -e "${BLUE}Step 7/8: Configuring Nginx...${NC}"

# Create Nginx configuration
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $NGINX_DOMAIN;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $NGINX_DOMAIN;

    # SSL Configuration (self-signed for now)
    ssl_certificate /etc/nginx/ssl/$APP_NAME.crt;
    ssl_certificate_key /etc/nginx/ssl/$APP_NAME.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/$APP_NAME-access.log;
    error_log /var/log/nginx/$APP_NAME-error.log;

    # Client body size
    client_max_body_size 50M;

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files optimization
    location /_next/static {
        proxy_pass http://localhost:$PORT;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Public files
    location /public {
        alias $DEPLOY_DIR/public;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }
}
EOF

# Create SSL directory if not exists
mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate (10 years)
if [ ! -f "/etc/nginx/ssl/$APP_NAME.crt" ]; then
    echo -e "${YELLOW}Generating self-signed SSL certificate...${NC}"
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/$APP_NAME.key \
        -out /etc/nginx/ssl/$APP_NAME.crt \
        -subj "/C=RS/ST=Belgrade/L=Belgrade/O=La Fantana/OU=IT/CN=$NGINX_DOMAIN"
    echo -e "${GREEN}✅ SSL certificate generated${NC}"
else
    echo -e "${YELLOW}⚠ SSL certificate already exists${NC}"
fi

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

echo -e "${BLUE}Step 8/8: Setting permissions...${NC}"
chown -R www-data:www-data $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR
echo -e "${GREEN}✅ Permissions set${NC}"
echo ""

echo ""
echo "=========================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETED!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Portal is now running at:${NC}"
echo -e "  • HTTP:  http://$NGINX_DOMAIN"
echo -e "  • HTTPS: https://$NGINX_DOMAIN"
echo ""
echo -e "${BLUE}Login credentials:${NC}"
echo -e "  • Username: ${GREEN}admin${NC}"
echo -e "  • Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  • Check status:    ${YELLOW}pm2 status${NC}"
echo -e "  • View logs:       ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "  • Restart app:     ${YELLOW}pm2 restart $APP_NAME${NC}"
echo -e "  • Stop app:        ${YELLOW}pm2 stop $APP_NAME${NC}"
echo -e "  • Nginx logs:      ${YELLOW}tail -f /var/log/nginx/$APP_NAME-*.log${NC}"
echo -e "  • Reload Nginx:    ${YELLOW}systemctl reload nginx${NC}"
echo ""
echo -e "${YELLOW}⚠ NOTE: Self-signed SSL certificate is installed.${NC}"
echo -e "${YELLOW}   Install /etc/nginx/ssl/$APP_NAME.crt on client devices.${NC}"
echo ""
echo -e "${GREEN}🎉 Enjoy your admin portal!${NC}"
echo ""

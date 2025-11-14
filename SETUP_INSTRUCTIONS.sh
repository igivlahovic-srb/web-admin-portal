#!/bin/bash

# La Fantana WHS - Nginx Setup Instructions
# Run these commands on your Ubuntu server

echo "=========================================="
echo "La Fantana WHS - Nginx Setup Commands"
echo "Copy and paste these commands on your Ubuntu server"
echo "=========================================="
echo ""

cat << 'SETUP_COMMANDS'

# ============================================
# STEP 1: Install Nginx
# ============================================

sudo apt-get update
sudo apt-get install -y nginx apache2-utils openssl

echo "✓ Nginx installed"

# ============================================
# STEP 2: Create directory structure
# ============================================

sudo mkdir -p /var/www/lafantana-whs/{apk,api,backups,web,logs}
sudo mkdir -p /etc/nginx/ssl

echo "✓ Directories created"

# ============================================
# STEP 3: Generate SSL certificate (10 years)
# ============================================

sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/lafantana-whs.key \
    -out /etc/nginx/ssl/lafantana-whs.crt \
    -subj "/C=RS/ST=Serbia/L=Belgrade/O=La Fantana/OU=IT/CN=appserver.lafantanasrb.local" \
    -addext "subjectAltName=DNS:appserver.lafantanasrb.local,DNS:localhost,IP:127.0.0.1"

sudo chmod 600 /etc/nginx/ssl/lafantana-whs.key
sudo chmod 644 /etc/nginx/ssl/lafantana-whs.crt

echo "✓ SSL certificate generated (valid for 10 years)"

# ============================================
# STEP 4: Copy Nginx configuration
# ============================================

# First, transfer the config file from workspace to server
# Then run:

sudo cp /home/user/workspace/nginx/lafantana-whs-full.conf /etc/nginx/sites-available/lafantana-whs
sudo ln -sf /etc/nginx/sites-available/lafantana-whs /etc/nginx/sites-enabled/lafantana-whs

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

echo "✓ Nginx configuration installed"

# ============================================
# STEP 5: Create initial API endpoint
# ============================================

sudo bash -c 'cat > /var/www/lafantana-whs/api/mobile-app.json << EOF
{
  "success": true,
  "data": {
    "hasApk": false,
    "latestVersion": "2.1.0",
    "downloadUrl": null,
    "message": "No APK uploaded yet. Build and deploy your first APK."
  }
}
EOF'

echo "✓ API endpoint created"

# ============================================
# STEP 6: Set permissions
# ============================================

sudo chown -R www-data:www-data /var/www/lafantana-whs
sudo chmod -R 755 /var/www/lafantana-whs
sudo chmod -R 777 /var/www/lafantana-whs/logs

echo "✓ Permissions set"

# ============================================
# STEP 7: Create admin password for backups
# ============================================

echo "Create admin password for backup access:"
sudo htpasswd -c /etc/nginx/.htpasswd admin

# ============================================
# STEP 8: Test and start Nginx
# ============================================

sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"

    sudo systemctl restart nginx
    sudo systemctl enable nginx

    echo "✓ Nginx started"
else
    echo "✗ Nginx configuration has errors"
    exit 1
fi

# ============================================
# STEP 9: Configure firewall
# ============================================

sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

echo "✓ Firewall configured"

# ============================================
# STEP 10: Test endpoints
# ============================================

echo ""
echo "Testing endpoints..."
curl -k -s https://localhost/health && echo "✓ Health check: OK" || echo "✗ Health check failed"
curl -k -s https://localhost/api/mobile-app.json && echo "✓ API endpoint: OK" || echo "✗ API endpoint failed"

# ============================================
# COMPLETE!
# ============================================

echo ""
echo "=========================================="
echo "✓✓✓ NGINX SETUP COMPLETE! ✓✓✓"
echo "=========================================="
echo ""
echo "Access your system:"
echo "  Web Admin: https://appserver.lafantanasrb.local"
echo "  API: https://appserver.lafantanasrb.local/api/"
echo "  Downloads: https://appserver.lafantanasrb.local/download/"
echo ""
echo "Next steps:"
echo "  1. Start web admin: cd web-admin && bun dev"
echo "  2. Build APK: ./build-apk.sh"
echo "  3. Deploy APK: ./deploy-apk-nginx.sh"
echo ""
echo "View logs:"
echo "  sudo tail -f /var/log/nginx/lafantana-whs-access.log"
echo ""

SETUP_COMMANDS

echo ""
echo "=========================================="
echo "Instructions saved!"
echo "=========================================="
echo ""
echo "To setup Nginx on your Ubuntu server:"
echo ""
echo "1. SSH to your server:"
echo "   ssh user@appserver.lafantanasrb.local"
echo ""
echo "2. Copy the workspace folder to server:"
echo "   scp -r /home/user/workspace/ user@server:/home/user/"
echo ""
echo "3. On the server, run:"
echo "   cd /home/user/workspace"
echo "   bash ./setup-nginx-full.sh"
echo ""
echo "Or manually run the commands shown above."
echo ""

# Server Setup Instructions

## Initial Setup

### 1. Clone Repository
```bash
cd ~
git clone https://019a6624-8c70-7588-b2d9-2c35197b6d10:notrequired@git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git webadminportal
cd webadminportal
```

### 2. Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 3. Install Dependencies
```bash
cd web-admin
bun install
```

### 4. Configure Database
Create `.env.local` file in `web-admin` directory:
```bash
nano web-admin/.env.local
```

Add your database configuration:
```
DB_SERVER=192.168.60.33
DB_NAME=LaFantanaSRB_FR3
DB_USER=sa
DB_PASSWORD=YourPassword
DB_PORT=1433
```

### 5. Build Application
```bash
bun run build
```

### 6. Setup Systemd Service
Create service file:
```bash
sudo nano /etc/systemd/system/lafantana-admin.service
```

Add this content:
```ini
[Unit]
Description=La Fantana WHS Admin Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/webadminportal/web-admin
Environment=NODE_ENV=production
Environment=PORT=3002
ExecStart=/root/.bun/bin/bun run start
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

### 7. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable lafantana-admin
sudo systemctl start lafantana-admin
sudo systemctl status lafantana-admin
```

## Service Management

### Check Status
```bash
sudo systemctl status lafantana-admin
```

### Restart Service
```bash
sudo systemctl restart lafantana-admin
```

### View Logs
```bash
sudo journalctl -u lafantana-admin -f
```

### Stop Service
```bash
sudo systemctl stop lafantana-admin
```

## Updating Application

### Method 1: Via Web Admin (Recommended)
1. Login to web admin panel at `http://server-ip:3002`
2. Go to Configuration tab
3. Click "Ažuriraj aplikaciju" button
4. Application will automatically pull latest changes, rebuild, and restart

### Method 2: Manual Update
```bash
cd ~/webadminportal
git pull vibecode main
cd web-admin
bun install
bun run build
sudo systemctl restart lafantana-admin
```

## Database Configuration

### Via Web Admin (Recommended)
1. Login to web admin panel
2. Go to Configuration → Database Connection tab
3. Enter your database credentials
4. Click "Snimi konfiguraciju" (Save Configuration)
5. Service will automatically restart with new configuration

### Manual Configuration
Edit `.env.local` file and restart service:
```bash
nano ~/webadminportal/web-admin/.env.local
sudo systemctl restart lafantana-admin
```

## Troubleshooting

### Service Won't Start
Check logs:
```bash
sudo journalctl -u lafantana-admin -n 50
```

### Database Connection Failed
1. Verify SQL Server is running on specified IP:port
```bash
telnet 192.168.60.33 1433
```

2. Check firewall rules:
```bash
sudo ufw status
sudo ufw allow 1433/tcp
```

3. Verify TCP/IP is enabled in SQL Server Configuration Manager

4. Test connection from web admin panel (Configuration → Database Connection → Test Connection)

### Port Already in Use
Check what's using port 3002:
```bash
sudo lsof -i :3002
```

Change port in systemd service file:
```bash
sudo nano /etc/systemd/system/lafantana-admin.service
# Change Environment=PORT=3002 to different port
sudo systemctl daemon-reload
sudo systemctl restart lafantana-admin
```

### Can't Access Web Admin
1. Check if service is running:
```bash
sudo systemctl status lafantana-admin
```

2. Check if port is accessible:
```bash
curl http://localhost:3002
```

3. Check firewall:
```bash
sudo ufw allow 3002/tcp
```

## Git Configuration

The project uses Vibecode Git as primary repository. Remote is configured as:
```bash
git remote -v
# Should show:
# vibecode  https://019a6624-8c70-7588-b2d9-2c35197b6d10:notrequired@git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git (fetch)
# vibecode  https://019a6624-8c70-7588-b2d9-2c35197b6d10:notrequired@git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git (push)
```

To add remote if missing:
```bash
cd ~/webadminportal
git remote add vibecode https://019a6624-8c70-7588-b2d9-2c35197b6d10:notrequired@git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git
```

## Security Notes

- Never commit `.env.local` file to git (it's in .gitignore)
- Keep database credentials secure
- Use strong passwords for SQL Server
- Consider using firewall rules to restrict access to ports 3002 and 1433
- Regularly update the application for security patches

## Application Info

- **Name**: La Fantana WHS Admin Panel
- **Version**: 2.1.0
- **Port**: 3002 (default)
- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun
- **Database**: MS SQL Server

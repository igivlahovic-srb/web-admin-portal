# BUN INSTALL Greška - Rešavanje

## 🔴 Problem
Pri pokretanju `bun install` ili update skripte dobijate grešku:
```
command failed: bun install
```

## ✅ Rešenja

### Rešenje 1: Proverite da li bun radi
```bash
# Test bun
bun --version

# Ako ne radi, reinstalirajte bun
curl -fsSL https://bun.sh/install | bash

# Dodajte u PATH (ako nije automatski dodato)
export PATH="$HOME/.bun/bin:$PATH"
source ~/.bashrc
```

### Rešenje 2: Očistite cache i lock fajl
```bash
cd /home/user/workspace/web-admin

# Obrišite lock fajl i cache
rm -f bun.lock
rm -rf node_modules/.cache
rm -rf .next

# Pokušajte ponovo
bun install
```

### Rešenje 3: Koristite npm umesto bun
Ako bun ne radi, možete koristiti npm:
```bash
cd /home/user/workspace/web-admin

# Obrišite bun specifične fajlove
rm -f bun.lock

# Koristite npm
npm install
npm run build
npm run start
```

### Rešenje 4: Proverite permissions
```bash
# Proverite ko je vlasnik direktorijuma
ls -la /home/user/workspace/web-admin

# Ako nije vaš user, promenite permissions
sudo chown -R $USER:$USER /home/user/workspace/web-admin

# Pokušajte ponovo
bun install
```

### Rešenje 5: Proverite disk space
```bash
# Proverite dostupan prostor
df -h

# Ako je disk pun, očistite
rm -rf /home/user/workspace/web-admin/.next
rm -rf /home/user/workspace/web-admin/node_modules/.cache
```

### Rešenje 6: Koristite ažurirani REBUILD.sh
Novi REBUILD.sh automatski detektuje bun/npm:
```bash
cd /home/user/workspace/web-admin
chmod +x REBUILD.sh
./REBUILD.sh
```

## 🔍 Debug: Provera tačne greške

Da biste videli tačnu grešku:
```bash
cd /home/user/workspace/web-admin
bun install 2>&1 | tee install-error.log
cat install-error.log
```

Česte greške i rešenja:

### Greška: "EACCES: permission denied"
```bash
# Rešenje: Fix permissions
sudo chown -R $USER:$USER /home/user/workspace/web-admin
```

### Greška: "ENOSPC: no space left on device"
```bash
# Rešenje: Očistite disk
rm -rf /home/user/workspace/web-admin/.next
docker system prune -a  # ako koristite docker
```

### Greška: "network timeout"
```bash
# Rešenje: Proverite internet ili koristite mirror
bun install --registry https://registry.npmmirror.com
```

### Greška: "lockfile is corrupt"
```bash
# Rešenje: Obrišite lock fajl
rm bun.lock
bun install
```

## 📝 Quick Fix (Najbrže rešenje)

```bash
cd /home/user/workspace/web-admin

# 1. Clean everything
rm -rf .next node_modules/.cache bun.lock

# 2. Try bun first
if command -v bun &> /dev/null; then
    echo "Using bun..."
    bun install && bun run build
else
    echo "Using npm..."
    npm install && npm run build
fi

# 3. Start server
if command -v pm2 &> /dev/null; then
    pm2 restart lafantana-whs-admin || pm2 start "bun run start" --name lafantana-whs-admin
else
    bun run start
fi
```

## 🚀 Za Ubuntu Server Deployment

Ako ste na Ubuntu serveru gde je portal deploy-ovan:

```bash
# 1. SSH u server
ssh user@your-server-ip

# 2. Idite u web-admin direktorijum
cd ~/webadminportal/web-admin  # ili gde god je instaliran

# 3. Pokrenite rebuild script
./REBUILD.sh
```

## ⚠️ Važne napomene

1. **Ne koristite sudo za bun install** - to može stvoriti permission probleme
2. **Bun i npm ne mogu koristiti isti lock fajl** - obrišite bun.lock ako prelazite na npm
3. **Node version**: Proverite da imate Node.js 18+ instaliran
4. **Memory**: Next.js build zahteva minimum 2GB RAM

## 📞 Ako ništa ne radi

Kontaktirajte sa kompletnim log-om:
```bash
cd /home/user/workspace/web-admin
bun install --verbose 2>&1 | tee full-error.log
```

Pošaljite `full-error.log` fajl za analizu.

# Web Portal - Kompletno Upravljanje BEZ SSH Pristupa

## 🎯 Cilj

**SVE operacije moraju biti dostupne direktno sa web portala** - bez potrebe za SSH pristupom Ubuntu serveru. Admin može sve da radi iz browser-a.

## ⚠️ VAŽNO: Očuvanje podataka prilikom ažuriranja

Kada se ažurira portal ili mobilna aplikacija:
- ✅ **SVI uneti podaci se MORAJU očuvati**
- ✅ **Baza podataka (data/\*.json fajlovi) se NE SME brisati**
- ✅ **Struktura direktorijuma ostaje ista**
- ✅ **Korisnici, servisi, operacije, delovi - sve ostaje**

## 📋 Funkcionalnosti koje treba dodati na Web Portal

### 1. Portal Update (bez SSH)

**Trenutno stanje**: Dokumentovan u `WEB_PORTAL_GITHUB_AUTO_UPDATE.md`

**Što dodati**:
- ✅ Dugme "Proveri za ažuriranje" u admin panelu
- ✅ Banner sa obaveštenjem kada ima nova verzija
- ✅ Dugme "Ažuriraj Portal" koje pokreće update
- ✅ Progress bar tokom update-a
- ✅ **BITNO**: Update NE SME brisati `data/` folder

#### Kako obezbediti očuvanje podataka:

```typescript
// U portal-update API endpoint-u
const updateScript = `
#!/bin/bash
set -e

cd /root/webadminportal/web-admin

# BACKUP podataka pre update-a
echo "[Update] Backing up data..."
cp -r data data.backup

# Git stash local changes (ako ih ima)
git stash

# Pull latest
git pull origin main

# Restore data ako je obrisana
if [ ! -d "data" ]; then
    echo "[Update] Restoring data..."
    mv data.backup data
else
    # Merge data ako treba
    echo "[Update] Data preserved"
    rm -rf data.backup
fi

# Install & build
npm install
npm run build

# Restart
pm2 restart lafantana-whs-admin
`;
```

### 2. Android APK Build (bez SSH)

**Lokacija**: `/admin/mobile-app` tab

**Što dodati**:

#### A. Dugme "Build Nova Verzija"

```tsx
// U /admin/mobile-app stranici
<button
  onClick={handleBuildAPK}
  className="bg-blue-600 text-white px-6 py-3 rounded-lg"
  disabled={isBuilding}
>
  {isBuilding ? 'Build u toku...' : 'Build Nova Verzija'}
</button>

{isBuilding && (
  <div className="mt-4">
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-blue-900 font-medium">
          Build u toku... (5-10 min)
        </span>
      </div>
      <div className="text-xs text-blue-800 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
        {buildLog}
      </div>
    </div>
  </div>
)}
```

#### B. API Endpoint za build

**Lokacija**: `/root/webadminportal/web-admin/app/api/build-apk/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { adminId } = await request.json();

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: 'Admin ID required' },
        { status: 400 }
      );
    }

    console.log(`[APK Build] Admin ${adminId} initiated build at ${new Date().toISOString()}`);

    // Pokreni build skriptu u pozadini
    exec(
      'cd /root/webadminportal && nohup ./BUILD_ANDROID_APK.sh > /tmp/apk-build.log 2>&1 &'
    );

    return NextResponse.json({
      success: true,
      message: 'APK build started. Check progress in 5-10 minutes.',
      logPath: '/tmp/apk-build.log',
    });
  } catch (error) {
    console.error('Error starting APK build:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to start APK build' },
      { status: 500 }
    );
  }
}

// GET - Proveri status build-a
export async function GET() {
  try {
    const fs = require('fs');
    const logPath = '/tmp/apk-build.log';

    if (!fs.existsSync(logPath)) {
      return NextResponse.json({
        success: true,
        data: {
          isBuilding: false,
          log: null,
        },
      });
    }

    const log = fs.readFileSync(logPath, 'utf-8');
    const isBuilding = !log.includes('✅ BUILD COMPLETED!');

    return NextResponse.json({
      success: true,
      data: {
        isBuilding,
        log: log.split('\n').slice(-30).join('\n'),
        completed: !isBuilding,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to check build status' },
      { status: 500 }
    );
  }
}
```

### 3. Backup Kreiranje (bez SSH)

**Lokacija**: `/admin/backup` tab

**Što dodati**:

```tsx
// Dugme za kreiranje backup-a
<button
  onClick={handleCreateBackup}
  className="bg-purple-600 text-white px-6 py-3 rounded-lg"
  disabled={isCreatingBackup}
>
  {isCreatingBackup ? 'Kreiranje backup-a...' : 'Kreiraj Backup'}
</button>

// Handler
const handleCreateBackup = async () => {
  setIsCreatingBackup(true);

  try {
    const response = await fetch('/api/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId: currentUser.id,
      }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success('Backup je kreiran! Sačekajte 1-2 minuta.');

      // Refresh listu nakon 60 sekundi
      setTimeout(() => {
        fetchBackups();
      }, 60000);
    } else {
      toast.error('Greška pri kreiranju backup-a');
    }
  } catch (error) {
    toast.error('Greška pri kreiranju backup-a');
  } finally {
    setIsCreatingBackup(false);
  }
};
```

#### API Endpoint za kreiranje backup-a

**Lokacija**: `/root/webadminportal/web-admin/app/api/backup/route.ts`

```typescript
// POST - Kreiraj novi backup
export async function POST(request: Request) {
  try {
    const { adminId } = await request.json();

    console.log(`[Backup] Admin ${adminId} initiated backup at ${new Date().toISOString()}`);

    // Pokreni backup skriptu u pozadini
    exec(
      'cd /root/webadminportal && nohup ./CREATE_BACKUP.sh > /tmp/backup-create.log 2>&1 &'
    );

    return NextResponse.json({
      success: true,
      message: 'Backup je pokrenut u pozadini. Sačekajte 1-2 minuta i refresh-ujte stranicu.',
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
```

### 4. Ponovno Otvaranje Servisa (već dokumentovano)

**Dokumentacija**: `WEB_PORTAL_SERVICE_REOPEN_FIX.md`

Implementirati:
- ✅ Dugme "Otvori ponovo" za zatvorene servise
- ✅ Modal sa razlogom
- ✅ Log sistema

### 5. Pregled Logova (bez SSH)

**Lokacija**: `/admin/logs` tab

**Što prikazati**:

```tsx
// Tabovi za različite logove
const logTypes = [
  { id: 'portal', name: 'Portal Logs', path: '/tmp/portal-update.log' },
  { id: 'apk', name: 'APK Build Logs', path: '/tmp/apk-build.log' },
  { id: 'backup', name: 'Backup Logs', path: '/tmp/backup-create.log' },
  { id: 'pm2', name: 'PM2 Logs', command: 'pm2 logs --lines 100 --nostream' },
];

<div className="space-y-4">
  {logTypes.map(logType => (
    <div key={logType.id} className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold mb-2">{logType.name}</h3>
      <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
        {logs[logType.id] || 'No logs available'}
      </pre>
      <button
        onClick={() => fetchLog(logType.id)}
        className="mt-2 text-blue-600 text-sm"
      >
        Refresh
      </button>
    </div>
  ))}
</div>
```

#### API za čitanje logova

```typescript
// /api/logs/[type]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;
    const fs = require('fs');

    let logContent = '';

    switch (type) {
      case 'portal':
        if (fs.existsSync('/tmp/portal-update.log')) {
          logContent = fs.readFileSync('/tmp/portal-update.log', 'utf-8');
        }
        break;

      case 'apk':
        if (fs.existsSync('/tmp/apk-build.log')) {
          logContent = fs.readFileSync('/tmp/apk-build.log', 'utf-8');
        }
        break;

      case 'backup':
        if (fs.existsSync('/tmp/backup-create.log')) {
          logContent = fs.readFileSync('/tmp/backup-create.log', 'utf-8');
        }
        break;

      case 'pm2':
        const { stdout } = await execAsync('pm2 logs --lines 100 --nostream');
        logContent = stdout;
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Unknown log type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        log: logContent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to read logs' },
      { status: 500 }
    );
  }
}
```

### 6. System Info (bez SSH)

**Lokacija**: `/admin/system` tab

**Prikazati**:

```tsx
<div className="grid grid-cols-2 gap-4">
  <InfoCard
    title="Disk Space"
    value={systemInfo.diskSpace}
    icon={<HardDriveIcon />}
  />
  <InfoCard
    title="Memory Usage"
    value={systemInfo.memoryUsage}
    icon={<CpuIcon />}
  />
  <InfoCard
    title="Uptime"
    value={systemInfo.uptime}
    icon={<ClockIcon />}
  />
  <InfoCard
    title="Portal Version"
    value={systemInfo.portalVersion}
    icon={<CodeIcon />}
  />
</div>
```

#### API za system info

```typescript
// /api/system-info/route.ts
export async function GET() {
  try {
    // Disk space
    const { stdout: diskSpace } = await execAsync('df -h / | tail -1');

    // Memory
    const { stdout: memory } = await execAsync('free -h | grep Mem');

    // Uptime
    const { stdout: uptime } = await execAsync('uptime -p');

    // Portal version
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    // PM2 status
    const { stdout: pm2Status } = await execAsync('pm2 jlist');

    return NextResponse.json({
      success: true,
      data: {
        diskSpace: diskSpace.trim(),
        memory: memory.trim(),
        uptime: uptime.trim(),
        portalVersion: packageJson.version,
        pm2Status: JSON.parse(pm2Status),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get system info' },
      { status: 500 }
    );
  }
}
```

## 🔒 Sigurnost - Očuvanje podataka

### Git Configuration

Dodati u `/root/webadminportal/web-admin/.gitignore`:

```
# NIKADA ne commit-ovati ove fajlove
data/*.json
data/backups/*
.env.local
```

### Update Skripta - Zaštita podataka

```bash
#!/bin/bash
# PORTAL UPDATE sa zaštitom podataka

set -e

cd /root/webadminportal/web-admin

echo "[Update] Creating data backup..."
BACKUP_DIR="/tmp/portal-data-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"
cp -r data "$BACKUP_DIR/" 2>/dev/null || echo "No data to backup"

echo "[Update] Stashing local changes..."
git stash

echo "[Update] Pulling latest changes..."
git pull origin main

echo "[Update] Restoring data..."
if [ -d "$BACKUP_DIR/data" ]; then
    # Restore samo ako git pull obrisao data
    if [ ! -d "data" ]; then
        cp -r "$BACKUP_DIR/data" ./
        echo "[Update] Data restored from backup"
    else
        echo "[Update] Data already exists, skipping restore"
    fi
fi

echo "[Update] Installing dependencies..."
npm install

echo "[Update] Building..."
npm run build

echo "[Update] Restarting portal..."
pm2 restart lafantana-whs-admin

echo "[Update] Cleaning up backup..."
rm -rf "$BACKUP_DIR"

echo "[Update] ✅ Update completed successfully!"
```

## ✅ Kompletan Admin Panel - Funkcionalnosti

### Navigation Menu

```tsx
const adminMenuItems = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Servisi', href: '/admin/services', icon: WrenchIcon },
  { name: 'Korisnici', href: '/admin/users', icon: UsersIcon },
  { name: 'Radni Dani', href: '/admin/workdays', icon: CalendarIcon },
  { name: 'Mobilna Aplikacija', href: '/admin/mobile-app', icon: PhoneIcon },
  { name: 'Backup', href: '/admin/backup', icon: ArchiveIcon },
  { name: 'Logovi', href: '/admin/logs', icon: DocumentIcon },
  { name: 'Sistem', href: '/admin/system', icon: ServerIcon },
  { name: 'Podešavanja', href: '/admin/settings', icon: CogIcon },
];
```

### Sve funkcije dostupne sa portala:

- ✅ **Pregled servisa** - Svi servisi, filteri, search
- ✅ **Ponovno otvaranje servisa** - Dugme + razlog
- ✅ **Upravljanje korisnicima** - Dodaj, izmeni, obriši
- ✅ **Radni dani** - Zatvori, otvori ponovo sa razlogom
- ✅ **Portal update** - Proveri, ažuriraj sa jednim klikom
- ✅ **APK build** - Build nova verzija direktno sa portala
- ✅ **Backup** - Kreiraj, preuzmi, lista svih backup-ova
- ✅ **Logovi** - Portal, APK build, Backup, PM2 logovi
- ✅ **System info** - Disk, memory, uptime, verzija

## 🎯 Prioritet Implementacije

1. ✅ **Portal Update** - Najvažnije (već dokumentovano)
2. ✅ **APK Build sa portala** - Druga prioritet
3. ✅ **Backup kreiranje** - Treća prioritet
4. ✅ **Logovi viewer** - Četvrta prioritet
5. ✅ **System info** - Peta prioritet

---

**Kreirao**: Claude Code
**Za**: La Fantana WHS Web Portal
**Fokus**: Sve operacije sa web portala BEZ SSH pristupa
**Datum**: 2025-01-11

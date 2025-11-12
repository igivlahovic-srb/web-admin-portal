# Web Portal - GitHub Version Check & Auto-Update

## 🎯 Cilj

Web portal treba automatski da proverava GitHub repozitorijum za novu verziju i prikazuje banner sa opcijom za ažuriranje.

## 📋 Kako radi

1. Portal proverava GitHub API za poslednji commit/tag
2. Upoređuje sa trenutnom verzijom portala
3. Ako ima novu verziju, prikazuje banner sa dugmetom "Ažuriraj"
4. Admin klikne dugme → portal se automatski ažurira (git pull + rebuild)

## 🔧 Implementacija

### 1. API Endpoint za proveru verzije sa GitHub-a

Lokacija: `/root/webadminportal/web-admin/app/api/github-version/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// GitHub repozitorijum info (promenite prema vašem repo-u)
const GITHUB_REPO = 'your-username/your-repo-name';
const GITHUB_BRANCH = 'main';

interface VersionInfo {
  currentVersion: string;
  currentCommit: string;
  latestCommit: string;
  latestCommitMessage: string;
  latestCommitDate: string;
  hasUpdate: boolean;
  behindBy: number;
}

export async function GET() {
  try {
    // Dobij trenutnu verziju iz package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = packageJson.version || '1.0.0';

    // Dobij trenutni commit hash
    const { stdout: currentCommit } = await execAsync(
      'git rev-parse --short HEAD',
      { cwd: process.cwd() }
    );

    // Fetch najnovije izmene sa remote-a (bez merge-a)
    await execAsync('git fetch origin', { cwd: process.cwd() });

    // Dobij najnoviji commit sa remote-a
    const { stdout: latestCommit } = await execAsync(
      `git rev-parse --short origin/${GITHUB_BRANCH}`,
      { cwd: process.cwd() }
    );

    // Dobij poruku poslednjeg commit-a
    const { stdout: latestCommitMessage } = await execAsync(
      `git log origin/${GITHUB_BRANCH} -1 --pretty=format:%s`,
      { cwd: process.cwd() }
    );

    // Dobij datum poslednjeg commit-a
    const { stdout: latestCommitDate } = await execAsync(
      `git log origin/${GITHUB_BRANCH} -1 --pretty=format:%ci`,
      { cwd: process.cwd() }
    );

    // Proveri koliko commit-ova smo pozadi
    const { stdout: behindByStr } = await execAsync(
      `git rev-list --count HEAD..origin/${GITHUB_BRANCH}`,
      { cwd: process.cwd() }
    );

    const currentCommitClean = currentCommit.trim();
    const latestCommitClean = latestCommit.trim();
    const behindBy = parseInt(behindByStr.trim(), 10);
    const hasUpdate = behindBy > 0;

    const versionInfo: VersionInfo = {
      currentVersion,
      currentCommit: currentCommitClean,
      latestCommit: latestCommitClean,
      latestCommitMessage: latestCommitMessage.trim(),
      latestCommitDate: latestCommitDate.trim(),
      hasUpdate,
      behindBy,
    };

    return NextResponse.json({
      success: true,
      data: versionInfo,
    });
  } catch (error) {
    console.error('Error checking GitHub version:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check GitHub version',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### 2. API Endpoint za ažuriranje portala

Lokacija: `/root/webadminportal/web-admin/app/api/portal-update/route.ts`

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
        { success: false, message: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Log update akciju
    console.log(`[Portal Update] Admin ${adminId} initiated update at ${new Date().toISOString()}`);

    // Pokreni update skript u pozadini
    const updateScript = `
#!/bin/bash
set -e

echo "[Update] Starting portal update..."

# Idi u web-admin direktorijum
cd /root/webadminportal/web-admin

# Pull najnovije izmene
echo "[Update] Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "[Update] Installing dependencies..."
npm install

# Build aplikaciju
echo "[Update] Building application..."
npm run build

# Restart PM2
echo "[Update] Restarting portal..."
pm2 restart lafantana-whs-admin

echo "[Update] Update completed successfully!"
    `;

    // Sačuvaj update skript
    const fs = require('fs');
    const scriptPath = '/tmp/portal-update.sh';
    fs.writeFileSync(scriptPath, updateScript, { mode: 0o755 });

    // Pokreni update u pozadini
    exec(`nohup bash ${scriptPath} > /tmp/portal-update.log 2>&1 &`);

    return NextResponse.json({
      success: true,
      message: 'Portal update started. Please wait 2-3 minutes and refresh the page.',
      logPath: '/tmp/portal-update.log',
    });
  } catch (error) {
    console.error('Error starting portal update:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to start portal update',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - Proveri status update-a
export async function GET() {
  try {
    const fs = require('fs');
    const logPath = '/tmp/portal-update.log';

    if (!fs.existsSync(logPath)) {
      return NextResponse.json({
        success: true,
        data: {
          isUpdating: false,
          log: null,
        },
      });
    }

    const log = fs.readFileSync(logPath, 'utf-8');
    const isUpdating = !log.includes('[Update] Update completed successfully!');

    return NextResponse.json({
      success: true,
      data: {
        isUpdating,
        log: log.split('\n').slice(-20).join('\n'), // Poslednja 20 linija
      },
    });
  } catch (error) {
    console.error('Error checking update status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check update status' },
      { status: 500 }
    );
  }
}
```

### 3. Banner komponenta za prikazivanje update notifikacije

Lokacija: `/root/webadminportal/web-admin/components/PortalUpdateBanner.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface VersionInfo {
  currentVersion: string;
  currentCommit: string;
  latestCommit: string;
  latestCommitMessage: string;
  latestCommitDate: string;
  hasUpdate: boolean;
  behindBy: number;
}

export default function PortalUpdateBanner() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForUpdates();

    // Proveri za update svakih 10 minuta
    const interval = setInterval(checkForUpdates, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Ako je update u toku, proveri status svakih 5 sekundi
  useEffect(() => {
    if (!updating) return;

    const interval = setInterval(checkUpdateStatus, 5000);

    return () => clearInterval(interval);
  }, [updating]);

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/github-version');
      const data = await response.json();

      if (data.success && data.data) {
        setVersionInfo(data.data);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUpdateStatus = async () => {
    try {
      const response = await fetch('/api/portal-update');
      const data = await response.json();

      if (data.success && data.data) {
        setUpdateProgress(data.data.log || '');

        if (!data.data.isUpdating) {
          // Update je završen
          setUpdating(false);

          // Automatski refresh stranice nakon 3 sekunde
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error checking update status:', error);
    }
  };

  const handleUpdate = async () => {
    if (!confirm('Da li ste sigurni da želite da ažurirate web portal? Portal će biti nedostupan 2-3 minuta.')) {
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch('/api/portal-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: 'admin', // Dobiti iz auth state-a
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert('Greška pri pokretanju update-a: ' + data.message);
        setUpdating(false);
      }
    } catch (error) {
      console.error('Error starting update:', error);
      alert('Greška pri pokretanju update-a');
      setUpdating(false);
    }
  };

  if (loading || !versionInfo?.hasUpdate || dismissed) {
    return null;
  }

  // Ako je update u toku, prikaži progress bar
  if (updating) {
    return (
      <div className="bg-blue-600 text-white px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <ArrowPathIcon className="h-6 w-6 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium">Portal se ažurira...</p>
              <p className="text-xs opacity-90 mt-1">
                Molimo sačekajte 2-3 minuta. Stranica će se automatski osvežiti.
              </p>
            </div>
          </div>
          {updateProgress && (
            <div className="bg-blue-700 rounded px-3 py-2 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
              {updateProgress}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              🎉 Nova verzija web portala je dostupna!
            </p>
            <p className="text-xs opacity-90 mt-1">
              {versionInfo.behindBy} {versionInfo.behindBy === 1 ? 'nova izmena' : 'novih izmena'} od poslednjeg ažuriranja
            </p>
            <p className="text-xs opacity-75 mt-1">
              Poslednja izmena: {versionInfo.latestCommitMessage}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpdate}
            className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
          >
            Ažuriraj Portal
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Zatvori obaveštenje"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4. Dodati banner u Layout

Lokacija: `/root/webadminportal/web-admin/app/layout.tsx`

```tsx
import PortalUpdateBanner from '@/components/PortalUpdateBanner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        {/* Portal Update Banner - prikazuje se na vrhu stranice */}
        <PortalUpdateBanner />

        {/* Ostatak layout-a */}
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## 🔐 Sigurnost

### 1. Dodati autentifikaciju

Samo admin korisnici mogu da pokrenu update:

```typescript
// U portal-update/route.ts
export async function POST(request: Request) {
  // Proveri autentifikaciju
  const session = await getServerSession();

  if (!session || session.user.role !== 'super_user') {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ... rest of code
}
```

### 2. Rate limiting

Dodati rate limiting da se spreči spam update-a:

```typescript
const lastUpdateTime: { [key: string]: number } = {};

export async function POST(request: Request) {
  const { adminId } = await request.json();

  const now = Date.now();
  const lastUpdate = lastUpdateTime[adminId] || 0;

  // Minimum 5 minuta između update-a
  if (now - lastUpdate < 5 * 60 * 1000) {
    return NextResponse.json(
      { success: false, message: 'Please wait before starting another update' },
      { status: 429 }
    );
  }

  lastUpdateTime[adminId] = now;

  // ... rest of code
}
```

## 🧪 Testiranje

### 1. Test version check

```bash
curl http://localhost:3002/api/github-version | jq
```

Očekivani output:
```json
{
  "success": true,
  "data": {
    "currentVersion": "2.1.0",
    "currentCommit": "abc123d",
    "latestCommit": "def456e",
    "latestCommitMessage": "Fix version endpoint",
    "latestCommitDate": "2025-01-11 15:30:00 +0100",
    "hasUpdate": true,
    "behindBy": 3
  }
}
```

### 2. Test update endpoint

```bash
curl -X POST http://localhost:3002/api/portal-update \
  -H "Content-Type: application/json" \
  -d '{"adminId":"admin"}' | jq
```

### 3. Test update status

```bash
curl http://localhost:3002/api/portal-update | jq
```

## 📊 Monitoring

### Log update akcija

Kreirajte `/root/webadminportal/web-admin/data/portal-updates.json`:

```typescript
// Log svaki update
const logUpdate = (adminId: string, success: boolean) => {
  const logPath = path.join(process.cwd(), 'data', 'portal-updates.json');

  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  }

  logs.push({
    adminId,
    timestamp: new Date().toISOString(),
    success,
    fromCommit: currentCommit,
    toCommit: latestCommit,
  });

  // Čuvaj samo poslednjih 50 log-ova
  if (logs.length > 50) {
    logs = logs.slice(-50);
  }

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
};
```

## ✅ Checklist

- [ ] Dodati `/api/github-version` endpoint
- [ ] Dodati `/api/portal-update` endpoint
- [ ] Kreirati `PortalUpdateBanner` komponentu
- [ ] Dodati banner u `layout.tsx`
- [ ] Dodati autentifikaciju za update endpoint
- [ ] Dodati rate limiting
- [ ] (Opciono) Dodati log sistem
- [ ] Testirati version check
- [ ] Testirati update proces
- [ ] Testirati auto-refresh nakon update-a

---

**Kreirao**: Claude Code
**Za**: La Fantana WHS Web Portal
**Datum**: 2025-01-11

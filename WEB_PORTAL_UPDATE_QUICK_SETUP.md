# Web Portal - GitHub Auto-Update QUICK SETUP

## 🚨 Problem

Portal ne prikazuje banner za ažuriranje jer **funkcionalnost nije još implementirana** - postoji samo dokumentacija.

## ✅ Brzo Rešenje - Copy-Paste Kod

### Korak 1: Kreiraj API endpoint za proveru verzije

**Fajl**: `/root/webadminportal/web-admin/app/api/github-version/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const GITHUB_BRANCH = 'main';

export async function GET() {
  try {
    const cwd = '/root/webadminportal/web-admin';

    // Dobij trenutni commit
    const { stdout: currentCommit } = await execAsync(
      'git rev-parse --short HEAD',
      { cwd }
    );

    // Fetch bez merge-a
    await execAsync('git fetch origin', { cwd });

    // Dobij najnoviji remote commit
    const { stdout: latestCommit } = await execAsync(
      `git rev-parse --short origin/${GITHUB_BRANCH}`,
      { cwd }
    );

    // Broj commitova pozadi
    const { stdout: behindByStr } = await execAsync(
      `git rev-list --count HEAD..origin/${GITHUB_BRANCH}`,
      { cwd }
    );

    // Poruka poslednjeg commit-a
    const { stdout: latestMessage } = await execAsync(
      `git log origin/${GITHUB_BRANCH} -1 --pretty=format:%s`,
      { cwd }
    );

    const behindBy = parseInt(behindByStr.trim(), 10);

    return NextResponse.json({
      success: true,
      data: {
        currentCommit: currentCommit.trim(),
        latestCommit: latestCommit.trim(),
        hasUpdate: behindBy > 0,
        behindBy,
        latestCommitMessage: latestMessage.trim(),
      },
    });
  } catch (error) {
    console.error('Error checking GitHub version:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check version' },
      { status: 500 }
    );
  }
}
```

### Korak 2: Kreiraj API endpoint za update

**Fajl**: `/root/webadminportal/web-admin/app/api/portal-update/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  try {
    const updateScript = `
#!/bin/bash
set -e
cd /root/webadminportal/web-admin

# Backup data
echo "[Update] Backing up data..."
cp -r data data.backup 2>/dev/null || true

# Git update
echo "[Update] Pulling changes..."
git stash
git pull origin main

# Restore data
if [ ! -d "data" ] && [ -d "data.backup" ]; then
    mv data.backup data
    echo "[Update] Data restored"
else
    rm -rf data.backup 2>/dev/null || true
fi

# Install & build
echo "[Update] Building..."
npm install
npm run build

# Restart
echo "[Update] Restarting..."
pm2 restart lafantana-whs-admin

echo "[Update] ✅ Done!"
    `;

    const fs = require('fs');
    const scriptPath = '/tmp/portal-update.sh';
    fs.writeFileSync(scriptPath, updateScript, { mode: 0o755 });

    exec(`nohup bash ${scriptPath} > /tmp/portal-update.log 2>&1 &`);

    return NextResponse.json({
      success: true,
      message: 'Update started. Please wait 2-3 minutes.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Update failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const fs = require('fs');
    const logPath = '/tmp/portal-update.log';

    if (!fs.existsSync(logPath)) {
      return NextResponse.json({
        success: true,
        data: { isUpdating: false, log: null },
      });
    }

    const log = fs.readFileSync(logPath, 'utf-8');
    const isUpdating = !log.includes('✅ Done!');

    return NextResponse.json({
      success: true,
      data: {
        isUpdating,
        log: log.split('\n').slice(-20).join('\n'),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to check status' },
      { status: 500 }
    );
  }
}
```

### Korak 3: Kreiraj Banner komponentu

**Fajl**: `/root/webadminportal/web-admin/components/PortalUpdateBanner.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function PortalUpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [behindBy, setBehindBy] = useState(0);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!updating) return;
    const interval = setInterval(checkUpdateStatus, 5000); // 5 sec
    return () => clearInterval(interval);
  }, [updating]);

  const checkForUpdates = async () => {
    try {
      const res = await fetch('/api/github-version');
      const data = await res.json();

      if (data.success && data.data) {
        setHasUpdate(data.data.hasUpdate);
        setBehindBy(data.data.behindBy);
        setMessage(data.data.latestCommitMessage);
      }
    } catch (error) {
      console.error('Error checking updates:', error);
    }
  };

  const checkUpdateStatus = async () => {
    try {
      const res = await fetch('/api/portal-update');
      const data = await res.json();

      if (data.success && data.data && !data.data.isUpdating) {
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleUpdate = async () => {
    if (!confirm('Ažurirati portal? Biće nedostupan 2-3 minuta.')) return;

    setUpdating(true);

    try {
      await fetch('/api/portal-update', { method: 'POST' });
    } catch (error) {
      alert('Greška pri ažuriranju');
      setUpdating(false);
    }
  };

  if (!hasUpdate || dismissed || updating) return null;

  if (updating) {
    return (
      <div className="bg-blue-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Portal se ažurira... Stranica će se automatski osvežiti.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-600 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold">
            🎉 Nova verzija portala je dostupna!
          </p>
          <p className="text-xs opacity-90">
            {behindBy} {behindBy === 1 ? 'nova izmena' : 'novih izmena'} • {message}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpdate}
            className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50"
          >
            Ažuriraj Portal
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Korak 4: Dodaj banner u Layout

**Fajl**: `/root/webadminportal/web-admin/app/layout.tsx`

Pronađi `<body>` tag i dodaj banner na vrhu:

```tsx
import PortalUpdateBanner from '@/components/PortalUpdateBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body>
        <PortalUpdateBanner />
        {children}
      </body>
    </html>
  );
}
```

### Korak 5: Rebuild i restart

```bash
cd /root/webadminportal/web-admin
npm run build
pm2 restart lafantana-whs-admin
```

## 🧪 Test

```bash
# Test API
curl http://localhost:3002/api/github-version | jq

# Očekivani output:
# {
#   "success": true,
#   "data": {
#     "currentCommit": "abc123d",
#     "latestCommit": "def456e",
#     "hasUpdate": true,
#     "behindBy": 5,
#     "latestCommitMessage": "Web Portal - Jednоsmerna sinhronizacija"
#   }
# }
```

Refresh portal u browser-u - trebalo bi da vidite **zeleni banner** na vrhu!

## 🚨 Troubleshooting

### Banner se ne pojavljuje

1. Proveri API endpoint:
   ```bash
   curl http://localhost:3002/api/github-version
   ```

2. Proveri browser console (F12):
   ```
   Error checking updates: ...
   ```

3. Proveri da li je komponenta učitana:
   ```bash
   ls /root/webadminportal/web-admin/components/PortalUpdateBanner.tsx
   ```

4. Rebuild:
   ```bash
   cd /root/webadminportal/web-admin
   rm -rf .next
   npm run build
   pm2 restart lafantana-whs-admin
   ```

### API greška "git command not found"

```bash
# Proveri da li je git instaliran
which git

# Ako nije, instaliraj
apt-get update && apt-get install -y git
```

### Permission denied

```bash
# Dodaj git safe directory
cd /root/webadminportal/web-admin
git config --global --add safe.directory /root/webadminportal/web-admin
```

---

**Kreirao**: Claude Code
**Za**: Web Portal GitHub Auto-Update
**Quick Setup**: Copy-paste kod spreman za upotrebu
**Datum**: 2025-01-11

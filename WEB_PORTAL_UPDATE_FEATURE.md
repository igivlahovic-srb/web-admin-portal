# Web Portal - Auto Update Notification Feature

## 📋 Pregled

Ova funkcionalnost dodaje **automatsko obaveštavanje o novoj verziji mobilne aplikacije** na web admin portalu. Kada se kreira nova APK verzija, portal će prikazati banner sa obaveštenjem.

## 🎯 Što implementirati

### 1. **Banner Komponenta za Update Obaveštenje**

Lokacija: `/root/webadminportal/web-admin/components/UpdateNotificationBanner.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UpdateInfo {
  hasNewVersion: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string | null;
}

export default function UpdateNotificationBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForUpdates();

    // Proveri za update svakih 5 minuta
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/mobile-app');
      const data = await response.json();

      if (data.success && data.data) {
        const { hasApk, latestVersion, downloadUrl, previousVersion } = data.data;

        // Proveri da li postoji nova verzija
        const hasNewVersion = hasApk && previousVersion &&
          compareVersions(latestVersion, previousVersion) > 0;

        setUpdateInfo({
          hasNewVersion,
          currentVersion: previousVersion || 'Nepoznato',
          latestVersion: latestVersion || 'Nepoznato',
          downloadUrl,
        });
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = (v1: string, v2: string): number => {
    const clean1 = v1.replace(/^v/, '');
    const clean2 = v2.replace(/^v/, '');

    const parts1 = clean1.split('.').map(Number);
    const parts2 = clean2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  };

  if (loading || !updateInfo?.hasNewVersion || dismissed) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-3 shadow-lg">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              🎉 Nova verzija mobilne aplikacije je dostupna!
            </p>
            <p className="text-xs opacity-90 mt-1">
              Verzija {updateInfo.latestVersion} (prethodna: {updateInfo.currentVersion})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {updateInfo.downloadUrl && (
            <a
              href={updateInfo.downloadUrl}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              download
            >
              Preuzmi APK
            </a>
          )}
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

### 2. **Dodati Banner u Layout**

Lokacija: `/root/webadminportal/web-admin/app/layout.tsx`

```tsx
import UpdateNotificationBanner from '@/components/UpdateNotificationBanner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        {/* Update Notification Banner - prikazuje se na vrhu stranice */}
        <UpdateNotificationBanner />

        {/* Ostatak layout-a */}
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### 3. **Proširiti API Endpoint za Praćenje Prethodne Verzije**

Lokacija: `/root/webadminportal/web-admin/app/api/mobile-app/route.ts`

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const APK_DIR = path.join(process.cwd(), 'public', 'apk');
const VERSION_HISTORY_FILE = path.join(APK_DIR, 'version-history.json');

interface VersionHistory {
  versions: {
    version: string;
    filename: string;
    uploadedAt: string;
  }[];
}

// GET - Dobij informacije o mobilnoj aplikaciji
export async function GET() {
  try {
    if (!fs.existsSync(APK_DIR)) {
      return NextResponse.json({
        success: true,
        data: {
          hasApk: false,
          latestVersion: null,
          downloadUrl: null,
          previousVersion: null,
        },
      });
    }

    // Učitaj verziju istorije
    let versionHistory: VersionHistory = { versions: [] };
    if (fs.existsSync(VERSION_HISTORY_FILE)) {
      const historyData = fs.readFileSync(VERSION_HISTORY_FILE, 'utf-8');
      versionHistory = JSON.parse(historyData);
    }

    // Pronađi sve APK fajlove
    const files = fs.readdirSync(APK_DIR);
    const apkFiles = files
      .filter((file) => file.endsWith('.apk'))
      .map((file) => {
        const filePath = path.join(APK_DIR, file);
        const stats = fs.statSync(filePath);

        // Ekstraktuj verziju iz imena fajla (lafantana-v2.1.0.apk)
        const versionMatch = file.match(/v?(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : '0.0.0';

        return {
          filename: file,
          version,
          size: stats.size,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    if (apkFiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasApk: false,
          latestVersion: null,
          downloadUrl: null,
          previousVersion: null,
        },
      });
    }

    const latestApk = apkFiles[0];
    const previousVersion = versionHistory.versions.length > 1
      ? versionHistory.versions[1].version
      : null;

    return NextResponse.json({
      success: true,
      data: {
        hasApk: true,
        latestVersion: latestApk.version,
        downloadUrl: `/apk/${latestApk.filename}`,
        filename: latestApk.filename,
        size: latestApk.size,
        modifiedAt: latestApk.modifiedAt,
        previousVersion, // Dodato za poređenje
        builds: apkFiles.slice(0, 3), // Poslednja 3 build-a
      },
    });
  } catch (error) {
    console.error('Error fetching mobile app info:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch mobile app information',
      },
      { status: 500 }
    );
  }
}

// POST - Upload novog APK-a
export async function POST(request: Request) {
  try {
    // ... (postojeći POST kod)

    // Nakon uspešnog upload-a, ažuriraj version history
    const newVersion = extractedVersion; // iz upload-a

    let versionHistory: VersionHistory = { versions: [] };
    if (fs.existsSync(VERSION_HISTORY_FILE)) {
      const historyData = fs.readFileSync(VERSION_HISTORY_FILE, 'utf-8');
      versionHistory = JSON.parse(historyData);
    }

    // Dodaj novu verziju na početak
    versionHistory.versions.unshift({
      version: newVersion,
      filename: uploadedFilename,
      uploadedAt: new Date().toISOString(),
    });

    // Čuvaj samo poslednjih 10 verzija
    versionHistory.versions = versionHistory.versions.slice(0, 10);

    // Sačuvaj ažuriranu istoriju
    fs.writeFileSync(
      VERSION_HISTORY_FILE,
      JSON.stringify(versionHistory, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: 'APK uploaded successfully',
      version: newVersion,
    });
  } catch (error) {
    console.error('Error uploading APK:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload APK' },
      { status: 500 }
    );
  }
}
```

### 4. **Alternativa: Jednostavniji Pristup (bez version history)**

Ako ne želite da implementirate version history fajl, možete koristiti jednostavniji pristup gde proveravate samo broj APK fajlova:

```tsx
// U UpdateNotificationBanner.tsx

const checkForUpdates = async () => {
  try {
    const response = await fetch('/api/mobile-app');
    const data = await response.json();

    if (data.success && data.data) {
      const { hasApk, builds } = data.data;

      // Ako ima više od jednog build-a, znači da je dodata nova verzija
      const hasNewVersion = hasApk && builds && builds.length > 1;

      // Proveri localStorage da vidimo da li je korisnik već video ovu verziju
      const lastSeenVersion = localStorage.getItem('lastSeenAppVersion');
      const latestVersion = builds?.[0]?.version;

      const shouldShow = hasNewVersion && lastSeenVersion !== latestVersion;

      if (shouldShow) {
        setUpdateInfo({
          hasNewVersion: true,
          currentVersion: builds[1]?.version || 'Nepoznato',
          latestVersion: latestVersion || 'Nepoznato',
          downloadUrl: `/apk/${builds[0]?.filename}`,
        });
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  } finally {
    setLoading(false);
  }
};

// Kada korisnik zatvori banner ili preuzme APK
const handleDismiss = () => {
  const latestVersion = updateInfo?.latestVersion;
  if (latestVersion) {
    localStorage.setItem('lastSeenAppVersion', latestVersion);
  }
  setDismissed(true);
};
```

## 🎨 Stilizovanje

Banner koristi Tailwind CSS klase. Možete prilagoditi boje:

- **Plavi banner** (informativni): `bg-blue-600`
- **Zeleni banner** (uspeh): `bg-green-600`
- **Narandžasti banner** (upozorenje): `bg-orange-600`

## 📱 Responsive Design

Banner je potpuno responsive:
- Desktop: Horizontalni layout sa dugmetom desno
- Mobile: Stack layout, dugme ispod teksta

## 🔔 Dodatne Opcije

### Opcija 1: Dodati Toast Notifikaciju

```bash
npm install react-hot-toast
```

```tsx
import toast from 'react-hot-toast';

useEffect(() => {
  if (updateInfo?.hasNewVersion) {
    toast.success('Nova verzija mobilne aplikacije je dostupna!', {
      duration: 5000,
      icon: '🎉',
    });
  }
}, [updateInfo]);
```

### Opcija 2: Dodati Sound Alert

```tsx
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play().catch(err => console.error('Audio play failed:', err));
};

useEffect(() => {
  if (updateInfo?.hasNewVersion) {
    playNotificationSound();
  }
}, [updateInfo]);
```

### Opcija 3: Dodati Email Notifikaciju

Proširiте POST endpoint u `/api/mobile-app/route.ts`:

```typescript
import nodemailer from 'nodemailer';

// Nakon upload-a novog APK-a
const sendEmailNotification = async (version: string) => {
  const transporter = nodemailer.createTransport({
    // Konfiguriši SMTP
  });

  await transporter.sendMail({
    from: 'noreply@lafantanasrb.local',
    to: 'admin@lafantanasrb.local',
    subject: `Nova verzija mobilne aplikacije: ${version}`,
    html: `
      <h2>Nova verzija mobilne aplikacije je dostupna!</h2>
      <p>Verzija: <strong>${version}</strong></p>
      <p>Preuzmite sa web admin panela.</p>
    `,
  });
};
```

## 🧪 Testiranje

1. **Upload novog APK-a** preko web portala
2. **Refresh stranice** - trebalo bi da vidite banner
3. **Kliknite "Preuzmi APK"** - trebalo bi da se preuzme fajl
4. **Kliknite X** - banner se sakriva
5. **Refresh stranice ponovo** - banner ne bi trebalo da se pojavi opet

## 📊 Monitoring

Dodajte analytics za praćenje:

```tsx
const handleDownload = () => {
  // Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'apk_download', {
      version: updateInfo?.latestVersion,
      source: 'update_banner',
    });
  }

  // Ili custom API
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'apk_downloaded',
      version: updateInfo?.latestVersion,
    }),
  });
};
```

## ✅ Checklist

- [ ] Kreiraj `UpdateNotificationBanner.tsx` komponentu
- [ ] Dodaj banner u `layout.tsx`
- [ ] Proširi `/api/mobile-app` endpoint
- [ ] Testiraj sa novim APK upload-om
- [ ] Proveri responsive dizajn
- [ ] (Opciono) Dodaj toast notifikacije
- [ ] (Opciono) Dodaj email notifikacije
- [ ] (Opciono) Dodaj analytics

---

**Napravljeno sa**: Claude Code
**Za**: La Fantana WHS v2.1.0
**Datum**: 2025-01-11

// Auto-update service for checking new APK versions
// Place in: src/services/auto-update.ts

import { Alert, Linking } from 'react-native';
import * as Application from 'expo-application';

const WEB_PORTAL_URL = 'http://appserver.lafantanasrb.local:3002'; // Change to your server IP

export interface VersionInfo {
  hasApk: boolean;
  latestVersion: string;
  downloadUrl: string | null;
  currentVersion: string;
  needsUpdate: boolean;
}

/**
 * Check if a new version is available on the web portal
 */
export async function checkForUpdates(): Promise<VersionInfo> {
  try {
    const currentVersion = Application.nativeApplicationVersion || '1.0.0';

    // Fetch latest version from web portal
    const response = await fetch(`${WEB_PORTAL_URL}/api/mobile-app`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid response from server');
    }

    const { hasApk, latestVersion, downloadUrl } = data.data;

    // Compare versions
    const needsUpdate = hasApk && compareVersions(latestVersion, currentVersion) > 0;

    return {
      hasApk,
      latestVersion: latestVersion || 'Nije dostupno',
      downloadUrl,
      currentVersion,
      needsUpdate,
    };
  } catch (error) {
    console.error('[AutoUpdate] Failed to check for updates:', error);

    // Return current version info even if check fails
    return {
      hasApk: false,
      latestVersion: 'Nepoznato',
      downloadUrl: null,
      currentVersion: Application.nativeApplicationVersion || '1.0.0',
      needsUpdate: false,
    };
  }
}

/**
 * Compare two version strings (e.g., "2.1.0" vs "2.0.0")
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
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
}

/**
 * Show update dialog to user
 */
export function showUpdateDialog(versionInfo: VersionInfo): void {
  if (!versionInfo.needsUpdate || !versionInfo.downloadUrl) {
    return;
  }

  Alert.alert(
    'Nova verzija dostupna!',
    `Trenutna verzija: ${versionInfo.currentVersion}\n` +
    `Nova verzija: ${versionInfo.latestVersion}\n\n` +
    'Želite li da preuzmete novu verziju?',
    [
      {
        text: 'Kasnije',
        style: 'cancel',
      },
      {
        text: 'Preuzmi',
        onPress: () => {
          if (versionInfo.downloadUrl) {
            Linking.openURL(versionInfo.downloadUrl).catch((err) => {
              console.error('[AutoUpdate] Failed to open download URL:', err);
              Alert.alert(
                'Greška',
                'Ne mogu da otvorim link za preuzimanje. Pokušajte ručno preko web portala.'
              );
            });
          }
        },
      },
    ]
  );
}

/**
 * Check for updates on app start (silent check)
 */
export async function checkForUpdatesOnStart(): Promise<void> {
  try {
    console.log('[AutoUpdate] Checking for updates...');
    const versionInfo = await checkForUpdates();

    console.log('[AutoUpdate] Version info:', {
      current: versionInfo.currentVersion,
      latest: versionInfo.latestVersion,
      needsUpdate: versionInfo.needsUpdate,
    });

    if (versionInfo.needsUpdate) {
      // Wait a bit before showing dialog (let app load first)
      setTimeout(() => {
        showUpdateDialog(versionInfo);
      }, 3000);
    }
  } catch (error) {
    console.error('[AutoUpdate] Error checking for updates:', error);
    // Silent fail - don't bother user if update check fails
  }
}

export default {
  checkForUpdates,
  showUpdateDialog,
  checkForUpdatesOnStart,
};

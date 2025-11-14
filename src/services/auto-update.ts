// Auto-update service for checking new APK versions
//
// HOW IT WORKS:
// - Checks web portal API for new APK versions on app startup
// - Only works with production APK builds (not in Expo Go development)
// - Shows dialog to user if newer version is available
// - In development mode, silently skips check (normal behavior)
//
// SETUP:
// 1. Change WEB_PORTAL_URL below to your actual server IP/domain
// 2. Build production APK: ./BUILD_ANDROID_APK.sh
// 3. Install APK on device
// 4. Auto-update will check on every app launch
//
// DEVELOPMENT:
// - Network errors are NORMAL in development (Expo Go cannot reach server)
// - These are logged as warnings, not errors
// - Auto-update is automatically disabled in __DEV__ mode

import { Alert, Linking } from 'react-native';
import * as Application from 'expo-application';

const WEB_PORTAL_URL = 'https://appserver.lafantanasrb.local'; // Nginx server (HTTPS with self-signed cert)

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

    // Fetch latest version from web portal with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${WEB_PORTAL_URL}/api/mobile-app`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
    // Silent fail - this is expected in development or when server is unreachable
    // Only log as warning, not error
    if (__DEV__) {
      console.warn('[AutoUpdate] Cannot check for updates (server not reachable):', error instanceof Error ? error.message : 'Unknown error');
      console.warn('[AutoUpdate] This is normal in development. Auto-update only works with production APK.');
    }

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
    // Only check for updates in production (not in Expo Go development)
    if (__DEV__) {
      console.log('[AutoUpdate] Skipping update check in development mode');
      return;
    }

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
    // Silent fail - don't bother user if update check fails
    if (__DEV__) {
      console.warn('[AutoUpdate] Update check failed (this is normal in development)');
    }
  }
}

export default {
  checkForUpdates,
  showUpdateDialog,
  checkForUpdatesOnStart,
};

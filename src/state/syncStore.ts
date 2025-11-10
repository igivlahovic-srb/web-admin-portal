import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import webAdminAPI from "../api/web-admin-sync";

interface SyncState {
  apiUrl: string;
  autoSync: boolean;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  setApiUrl: (url: string) => void;
  setAutoSync: (enabled: boolean) => void;
  setLastSyncTime: (time: Date) => void;
  setIsSyncing: (syncing: boolean) => void;
  testConnection: () => Promise<boolean>;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      apiUrl: "",
      autoSync: false,
      lastSyncTime: null,
      isSyncing: false,

      setApiUrl: (url: string) => {
        console.log("[SyncStore] Setting API URL to:", url);
        webAdminAPI.setApiUrl(url);
        set({ apiUrl: url });
      },

      setAutoSync: (enabled: boolean) => {
        console.log("[SyncStore] Setting auto sync to:", enabled);
        set({ autoSync: enabled });
      },

      setLastSyncTime: (time: Date) => {
        console.log("[SyncStore] Setting last sync time to:", time);
        set({ lastSyncTime: time });
      },

      setIsSyncing: (syncing: boolean) => {
        console.log("[SyncStore] Setting is syncing to:", syncing);
        set({ isSyncing: syncing });
      },

      testConnection: async () => {
        const currentUrl = get().apiUrl;
        console.log("[SyncStore] Testing connection to:", currentUrl);

        // Ensure webAdminAPI has the correct URL
        if (currentUrl) {
          webAdminAPI.setApiUrl(currentUrl);
        }

        const result = await webAdminAPI.testConnection();
        console.log("[SyncStore] Connection test result:", result);
        return result.success;
      },
    }),
    {
      name: "sync-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // After hydration, ensure webAdminAPI has the correct URL
        if (state?.apiUrl) {
          console.log("[SyncStore] Rehydrated with API URL:", state.apiUrl);
          webAdminAPI.setApiUrl(state.apiUrl);
        } else {
          console.log("[SyncStore] No API URL found after rehydration");
        }
      },
    }
  )
);

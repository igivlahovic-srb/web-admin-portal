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
      apiUrl: "http://localhost:3000",
      autoSync: false,
      lastSyncTime: null,
      isSyncing: false,

      setApiUrl: (url: string) => {
        webAdminAPI.setApiUrl(url);
        set({ apiUrl: url });
      },

      setAutoSync: (enabled: boolean) => {
        set({ autoSync: enabled });
      },

      setLastSyncTime: (time: Date) => {
        set({ lastSyncTime: time });
      },

      setIsSyncing: (syncing: boolean) => {
        set({ isSyncing: syncing });
      },

      testConnection: async () => {
        const result = await webAdminAPI.testConnection();
        return result.success;
      },
    }),
    {
      name: "sync-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

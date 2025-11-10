import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OperationTemplate, SparePartTemplate } from "../types";
import { useSyncStore } from "./syncStore";
import webAdminAPI from "../api/web-admin-sync";

interface ConfigState {
  operations: OperationTemplate[];
  spareParts: SparePartTemplate[];
  lastConfigSync: Date | null;
  isLoading: boolean;
  isConnected: boolean;
  setOperations: (operations: OperationTemplate[]) => void;
  setSpareParts: (spareParts: SparePartTemplate[]) => void;
  fetchConfig: () => Promise<boolean>;
  fetchSparePartsFromSQL: () => Promise<boolean>;
  checkConnection: () => Promise<boolean>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      operations: [],
      spareParts: [],
      lastConfigSync: null,
      isLoading: false,
      isConnected: false,

      setOperations: (operations) => set({ operations }),

      setSpareParts: (spareParts) => set({ spareParts }),

      checkConnection: async () => {
        try {
          const apiUrl = useSyncStore.getState().apiUrl;

          // If no API URL is configured, not connected
          if (!apiUrl || apiUrl.trim() === "") {
            set({ isConnected: false });
            return false;
          }

          // Try to ping the server
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(`${apiUrl}/api/config/operations`, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const connected = response.ok;
          set({ isConnected: connected });
          return connected;
        } catch (error) {
          set({ isConnected: false });
          return false;
        }
      },

      fetchConfig: async () => {
        set({ isLoading: true });
        try {
          const apiUrl = useSyncStore.getState().apiUrl;

          // If no API URL is configured, use default mock data
          if (!apiUrl || apiUrl.trim() === "") {
            console.warn("No API URL configured. Using default mock data.");
            set({
              operations: [
                { id: "1", code: "OP-001", name: "Čišćenje rezervoara", description: "Kompletno čišćenje rezervoara za vodu", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "2", code: "OP-002", name: "Zamena filtera", description: "Zamena filter uloška", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "3", code: "OP-003", name: "Provera slavina", description: "Provera funkcionalnosti slavina", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "4", code: "OP-004", name: "Provera sistema hlađenja", description: "Provera hladnjaka i kompresora", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "5", code: "OP-005", name: "Provera grejača", description: "Provera funkcije grejanja vode", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "6", code: "OP-006", name: "Zamena cevi", description: "Zamena silikonskih cevi", isActive: true, createdAt: new Date("2024-01-01") },
              ],
              spareParts: [
                { id: "1", code: "RD-001", name: "Filter uložak", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "2", code: "RD-002", name: "Slavina za hladnu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "3", code: "RD-003", name: "Slavina za toplu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "4", code: "RD-004", name: "Silikonske cevi", unit: "m", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "5", code: "RD-005", name: "Grejač", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
                { id: "6", code: "RD-006", name: "Termostat", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
              ],
              lastConfigSync: new Date(),
              isLoading: false,
            });
            return true;
          }

          // Fetch operations
          const opsResponse = await fetch(`${apiUrl}/api/config/operations`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const opsData = await opsResponse.json();

          if (!opsData.success) {
            set({ isLoading: false });
            return false;
          }

          // Fetch spare parts
          const partsResponse = await fetch(`${apiUrl}/api/config/spare-parts`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const partsData = await partsResponse.json();

          if (!partsData.success) {
            set({ isLoading: false });
            return false;
          }

          set({
            operations: opsData.data.operations || [],
            spareParts: partsData.data.spareParts || [],
            lastConfigSync: new Date(),
            isLoading: false,
            isConnected: true,
          });

          return true;
        } catch (error) {
          // Silent error - this is expected when web panel is not running
          // Application continues to work with default/cached data

          // Fallback to default data if fetch fails
          set({
            operations: [
              { id: "1", code: "OP-001", name: "Čišćenje rezervoara", description: "Kompletno čišćenje rezervoara za vodu", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "2", code: "OP-002", name: "Zamena filtera", description: "Zamena filter uloška", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "3", code: "OP-003", name: "Provera slavina", description: "Provera funkcionalnosti slavina", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "4", code: "OP-004", name: "Provera sistema hlađenja", description: "Provera hladnjaka i kompresora", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "5", code: "OP-005", name: "Provera grejača", description: "Provera funkcije grejanja vode", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "6", code: "OP-006", name: "Zamena cevi", description: "Zamena silikonskih cevi", isActive: true, createdAt: new Date("2024-01-01") },
            ],
            spareParts: [
              { id: "1", code: "RD-001", name: "Filter uložak", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "2", code: "RD-002", name: "Slavina za hladnu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "3", code: "RD-003", name: "Slavina za toplu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "4", code: "RD-004", name: "Silikonske cevi", unit: "m", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "5", code: "RD-005", name: "Grejač", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
              { id: "6", code: "RD-006", name: "Termostat", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
            ],
            lastConfigSync: new Date(),
            isLoading: false,
          });
          return false;
        }
      },

      // Fetch spare parts from SQL database (ItemCode starting with "102")
      fetchSparePartsFromSQL: async () => {
        try {
          console.log("[ConfigStore] Fetching spare parts from SQL database...");
          const result = await webAdminAPI.fetchSpareParts();

          if (result.success && result.data && result.data.spareParts) {
            const spareParts = result.data.spareParts.map((part: any) => ({
              id: part.id,
              code: part.code,
              name: part.name,
              unit: "kom", // Default unit
              isActive: true,
              createdAt: new Date(),
            }));

            console.log("[ConfigStore] Loaded spare parts from SQL:", spareParts.length);
            set({ spareParts, lastConfigSync: new Date() });
            return true;
          }

          console.warn("[ConfigStore] Failed to fetch spare parts from SQL");
          return false;
        } catch (error) {
          console.error("[ConfigStore] Error fetching spare parts from SQL:", error);
          return false;
        }
      },
    }),
    {
      name: "config-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

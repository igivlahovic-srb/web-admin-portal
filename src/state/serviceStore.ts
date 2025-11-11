import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ServiceTicket, Operation, SparePart } from "../types";
import webAdminAPI from "../api/web-admin-sync";

interface ServiceState {
  tickets: ServiceTicket[];
  currentTicket: ServiceTicket | null;
  addTicket: (ticket: ServiceTicket) => void;
  updateTicket: (id: string, updates: Partial<ServiceTicket>) => void;
  completeTicket: (id: string) => void;
  reopenTicket: (id: string) => void;
  setCurrentTicket: (ticket: ServiceTicket | null) => void;
  addOperationToCurrentTicket: (operation: Operation) => void;
  addSparePartToCurrentTicket: (sparePart: SparePart) => void;
  removeOperationFromCurrentTicket: (operationId: string) => void;
  removeSparePartFromCurrentTicket: (sparePartId: string) => void;
  cleanupOldCompletedTickets: () => void;
  syncToWeb: () => Promise<boolean>;
  syncFromWeb: () => Promise<boolean>;
  bidirectionalSync: () => Promise<boolean>;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    (set, get) => ({
      tickets: [],
      currentTicket: null,
      addTicket: (ticket) =>
        set((state) => ({ tickets: [...state.tickets, ticket] })),
      updateTicket: (id, updates) =>
        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          currentTicket:
            state.currentTicket?.id === id
              ? { ...state.currentTicket, ...updates }
              : state.currentTicket,
        })),
      completeTicket: (id) =>
        set((state) => {
          const endTime = new Date();
          return {
            tickets: state.tickets.map((t) => {
              if (t.id === id) {
                const durationMinutes = Math.round(
                  (endTime.getTime() - new Date(t.startTime).getTime()) / 60000
                );
                return {
                  ...t,
                  status: "completed" as const,
                  endTime,
                  durationMinutes,
                };
              }
              return t;
            }),
            currentTicket:
              state.currentTicket?.id === id
                ? (() => {
                    const durationMinutes = Math.round(
                      (endTime.getTime() -
                        new Date(state.currentTicket.startTime).getTime()) /
                        60000
                    );
                    return {
                      ...state.currentTicket,
                      status: "completed" as const,
                      endTime,
                      durationMinutes,
                    };
                  })()
                : state.currentTicket,
          };
        }),
      reopenTicket: (id) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === id
              ? { ...t, status: "in_progress" as const, endTime: undefined, durationMinutes: undefined }
              : t
          ),
          currentTicket:
            state.currentTicket?.id === id
              ? {
                  ...state.currentTicket,
                  status: "in_progress" as const,
                  endTime: undefined,
                  durationMinutes: undefined,
                }
              : state.currentTicket,
        })),
      setCurrentTicket: (ticket) => set({ currentTicket: ticket }),
      addOperationToCurrentTicket: (operation) =>
        set((state) => {
          if (!state.currentTicket) return state;
          const updatedTicket = {
            ...state.currentTicket,
            operations: [...state.currentTicket.operations, operation],
          };
          return {
            currentTicket: updatedTicket,
            tickets: state.tickets.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t
            ),
          };
        }),
      addSparePartToCurrentTicket: (sparePart) =>
        set((state) => {
          if (!state.currentTicket) return state;
          const updatedTicket = {
            ...state.currentTicket,
            spareParts: [...state.currentTicket.spareParts, sparePart],
          };
          return {
            currentTicket: updatedTicket,
            tickets: state.tickets.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t
            ),
          };
        }),
      removeOperationFromCurrentTicket: (operationId) =>
        set((state) => {
          if (!state.currentTicket) return state;
          const updatedTicket = {
            ...state.currentTicket,
            operations: state.currentTicket.operations.filter(
              (op) => op.id !== operationId
            ),
          };
          return {
            currentTicket: updatedTicket,
            tickets: state.tickets.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t
            ),
          };
        }),
      removeSparePartFromCurrentTicket: (sparePartId) =>
        set((state) => {
          if (!state.currentTicket) return state;
          const updatedTicket = {
            ...state.currentTicket,
            spareParts: state.currentTicket.spareParts.filter(
              (sp) => sp.id !== sparePartId
            ),
          };
          return {
            currentTicket: updatedTicket,
            tickets: state.tickets.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t
            ),
          };
        }),
      cleanupOldCompletedTickets: () =>
        set((state) => {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          threeDaysAgo.setHours(0, 0, 0, 0);

          const originalCount = state.tickets.length;
          const completedTickets = state.tickets.filter((t) => t.status === "completed");

          const filteredTickets = state.tickets.filter((ticket) => {
            if (ticket.status === "in_progress") {
              return true;
            }

            if (ticket.status === "completed" && ticket.endTime) {
              const ticketEndDate = new Date(ticket.endTime);
              return ticketEndDate >= threeDaysAgo;
            }

            return true;
          });

          const deletedCount = originalCount - filteredTickets.length;

          if (deletedCount > 0) {
            console.log(`[ServiceStore] Cleanup: Deleted ${deletedCount} completed tickets older than 3 days`);
            console.log(`[ServiceStore] Total completed tickets: ${completedTickets.length}, Kept: ${filteredTickets.filter((t) => t.status === "completed").length}`);
          }

          return { tickets: filteredTickets };
        }),
      syncToWeb: async () => {
        try {
          const tickets = get().tickets;
          console.log("[ServiceStore] Syncing tickets to web. Count:", tickets.length);
          console.log("[ServiceStore] API URL:", webAdminAPI.getApiUrl());

          const result = await webAdminAPI.syncTickets(tickets);
          console.log("[ServiceStore] Sync result:", result);

          if (result.success) {
            get().cleanupOldCompletedTickets();
          }

          return result.success;
        } catch (error) {
          console.error("[ServiceStore] Failed to sync tickets to web:", error);
          return false;
        }
      },
      syncFromWeb: async () => {
        try {
          console.log("[ServiceStore] Fetching tickets from web...");
          const result = await webAdminAPI.fetchTickets();

          if (!result.success || !result.data) {
            console.error("[ServiceStore] Failed to fetch tickets from web");
            return false;
          }

          const webTickets = result.data.tickets || [];
          console.log("[ServiceStore] Fetched tickets from web. Count:", webTickets.length);

          // Merge web tickets with local tickets
          const localTickets = get().tickets;
          const mergedTickets = [...localTickets];

          // Add or update tickets from web
          webTickets.forEach((webTicket: ServiceTicket) => {
            const localIndex = mergedTickets.findIndex(t => t.id === webTicket.id);

            if (localIndex === -1) {
              // New ticket from web - add it
              console.log("[ServiceStore] Adding new ticket from web:", webTicket.id);
              mergedTickets.push({
                ...webTicket,
                startTime: new Date(webTicket.startTime),
                endTime: webTicket.endTime ? new Date(webTicket.endTime) : undefined,
              });
            } else {
              // Ticket exists - merge using most recent update
              const localTicket = mergedTickets[localIndex];
              const webUpdated = webTicket.endTime ? new Date(webTicket.endTime) : new Date(webTicket.startTime);
              const localUpdated = localTicket.endTime ? new Date(localTicket.endTime) : new Date(localTicket.startTime);

              if (webUpdated > localUpdated) {
                // Web version is newer - use it
                console.log("[ServiceStore] Updating ticket from web (newer):", webTicket.id);
                mergedTickets[localIndex] = {
                  ...webTicket,
                  startTime: new Date(webTicket.startTime),
                  endTime: webTicket.endTime ? new Date(webTicket.endTime) : undefined,
                };
              }
            }
          });

          set({ tickets: mergedTickets });
          console.log("[ServiceStore] Merged tickets. Total count:", mergedTickets.length);

          return true;
        } catch (error) {
          console.error("[ServiceStore] Failed to sync from web:", error);
          return false;
        }
      },
      bidirectionalSync: async () => {
        try {
          console.log("[ServiceStore] Starting bidirectional sync...");

          // Step 1: Fetch from web first (to get reopened tickets)
          const fetchSuccess = await get().syncFromWeb();
          if (!fetchSuccess) {
            console.error("[ServiceStore] Failed to fetch from web");
            return false;
          }

          // Step 2: Push local changes to web
          const pushSuccess = await get().syncToWeb();
          if (!pushSuccess) {
            console.error("[ServiceStore] Failed to push to web");
            return false;
          }

          console.log("[ServiceStore] Bidirectional sync completed successfully");
          return true;
        } catch (error) {
          console.error("[ServiceStore] Bidirectional sync failed:", error);
          return false;
        }
      },
    }),
    {
      name: "service-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tickets: state.tickets.map((t) => ({
          ...t,
          startTime: t.startTime instanceof Date ? t.startTime.toISOString() : t.startTime,
          endTime: t.endTime instanceof Date ? t.endTime.toISOString() : t.endTime,
        })),
        currentTicket: state.currentTicket
          ? {
              ...state.currentTicket,
              startTime: state.currentTicket.startTime instanceof Date
                ? state.currentTicket.startTime.toISOString()
                : state.currentTicket.startTime,
              endTime: state.currentTicket.endTime instanceof Date
                ? state.currentTicket.endTime.toISOString()
                : state.currentTicket.endTime,
            }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.tickets) {
          state.tickets = state.tickets.map((t) => ({
            ...t,
            startTime: typeof t.startTime === "string" ? new Date(t.startTime) : t.startTime,
            endTime: t.endTime && typeof t.endTime === "string" ? new Date(t.endTime) : t.endTime,
          }));
        }
        if (state && state.currentTicket) {
          state.currentTicket = {
            ...state.currentTicket,
            startTime: typeof state.currentTicket.startTime === "string"
              ? new Date(state.currentTicket.startTime)
              : state.currentTicket.startTime,
            endTime: state.currentTicket.endTime && typeof state.currentTicket.endTime === "string"
              ? new Date(state.currentTicket.endTime)
              : state.currentTicket.endTime,
          };
        }
      },
    }
  )
);

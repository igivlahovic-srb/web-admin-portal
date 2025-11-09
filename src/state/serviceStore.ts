import { create } from "zustand";
import { ServiceTicket, Operation, SparePart } from "../types";
import webAdminAPI from "../api/web-admin-sync";

interface ServiceState {
  tickets: ServiceTicket[];
  currentTicket: ServiceTicket | null;
  addTicket: (ticket: ServiceTicket) => void;
  updateTicket: (id: string, updates: Partial<ServiceTicket>) => void;
  completeTicket: (id: string) => void;
  setCurrentTicket: (ticket: ServiceTicket | null) => void;
  addOperationToCurrentTicket: (operation: Operation) => void;
  addSparePartToCurrentTicket: (sparePart: SparePart) => void;
  removeOperationFromCurrentTicket: (operationId: string) => void;
  removeSparePartFromCurrentTicket: (sparePartId: string) => void;
  syncToWeb: () => Promise<boolean>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
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
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, status: "completed", endTime: new Date() } : t
      ),
      currentTicket:
        state.currentTicket?.id === id
          ? { ...state.currentTicket, status: "completed", endTime: new Date() }
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
  syncToWeb: async () => {
    try {
      const tickets = get().tickets;
      const result = await webAdminAPI.syncTickets(tickets);
      return result.success;
    } catch (error) {
      console.error("Failed to sync tickets to web:", error);
      return false;
    }
  },
}));

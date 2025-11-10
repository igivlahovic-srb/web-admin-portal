import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import webAdminAPI from "../api/web-admin-sync";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: (User & { password: string })[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User & { password: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
  syncToWeb: () => Promise<boolean>;
  fetchFromWeb: () => Promise<boolean>;
}

// Mock users for demo - in production, this would call an API
const INITIAL_USERS: (User & { password: string })[] = [
  {
    id: "1",
    charismaId: "CH-001",
    username: "admin",
    password: "admin123",
    name: "Administrator",
    role: "super_user",
    depot: "Beograd",
    isActive: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    charismaId: "CH-002",
    username: "marko",
    password: "marko123",
    name: "Marko Petrović",
    role: "technician",
    depot: "Beograd",
    isActive: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    charismaId: "CH-003",
    username: "jovan",
    password: "jovan123",
    name: "Jovan Nikolić",
    role: "technician",
    depot: "Niš",
    isActive: true,
    createdAt: new Date("2024-02-01"),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      allUsers: INITIAL_USERS,
      login: async (username: string, password: string) => {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user = get().allUsers.find(
          (u) => u.username === username && u.password === password && u.isActive
        );

        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({ user: userWithoutPassword, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      addUser: (user) => {
        set((state) => ({
          allUsers: [...state.allUsers, user],
        }));
      },
      updateUser: (id, updates) => {
        set((state) => ({
          allUsers: state.allUsers.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
        }));
      },
      deleteUser: (id) => {
        set((state) => ({
          allUsers: state.allUsers.filter((u) => u.id !== id),
        }));
      },
      toggleUserActive: (id) => {
        set((state) => ({
          allUsers: state.allUsers.map((u) =>
            u.id === id ? { ...u, isActive: !u.isActive } : u
          ),
        }));
      },
      syncToWeb: async () => {
        try {
          const users = get().allUsers;
          console.log("[AuthStore] Syncing users to web. Count:", users.length);
          console.log("[AuthStore] API URL:", webAdminAPI.getApiUrl());

          const result = await webAdminAPI.syncUsers(users);
          console.log("[AuthStore] Sync result:", result);

          return result.success;
        } catch (error) {
          console.error("[AuthStore] Failed to sync users to web:", error);
          return false;
        }
      },
      fetchFromWeb: async () => {
        try {
          const result = await webAdminAPI.fetchUsers();
          if (result.success && result.data && result.data.users) {
            set({ allUsers: result.data.users });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Failed to fetch users from web:", error);
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        allUsers: state.allUsers.map((u) => ({
          ...u,
          createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.allUsers) {
          state.allUsers = state.allUsers.map((u) => ({
            ...u,
            createdAt: typeof u.createdAt === "string" ? new Date(u.createdAt) : u.createdAt,
          }));
        }
        if (state && state.user && state.user.createdAt) {
          state.user.createdAt = typeof state.user.createdAt === "string" ? new Date(state.user.createdAt) : state.user.createdAt;
        }
      },
    }
  )
);

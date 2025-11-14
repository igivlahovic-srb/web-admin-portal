import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import webAdminAPI from "../api/web-admin-sync";
import { useSyncStore } from "./syncStore";

// Helper function to trigger auto sync if enabled
const triggerAutoSync = async () => {
  const { autoSync, apiUrl } = useSyncStore.getState();
  if (autoSync && apiUrl) {
    console.log("[AuthStore] Auto sync triggered");
    const { syncToWeb } = useAuthStore.getState();
    await syncToWeb();
  }
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: (User & { password: string })[];
  pendingTwoFactorUserId: string | null;
  login: (username: string, password: string) => Promise<boolean | "2fa_required">;
  completeTwoFactorLogin: () => void;
  logout: () => void;
  addUser: (user: User & { password: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
  syncToWeb: () => Promise<boolean>;
  fetchFromWeb: () => Promise<boolean>;
  closeWorkday: () => Promise<boolean>;
  openWorkday: (userId: string, reason: string, adminId: string) => Promise<boolean>;
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
      pendingTwoFactorUserId: null,
      login: async (username: string, password: string) => {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user = get().allUsers.find(
          (u) => u.username === username && u.password === password && u.isActive
        );

        if (user) {
          // Check if 2FA is enabled for this user (set by admin from web portal)
          const is2FAEnabled = user.twoFactorEnabled === true;

          if (is2FAEnabled) {
            // Store user ID for pending 2FA verification
            set({ pendingTwoFactorUserId: user.id });
            return "2fa_required";
          }

          // No 2FA, complete login
          const { password: _, ...userWithoutPassword } = user;
          set({ user: userWithoutPassword, isAuthenticated: true, pendingTwoFactorUserId: null });
          return true;
        }
        return false;
      },
      completeTwoFactorLogin: () => {
        const pendingUserId = get().pendingTwoFactorUserId;
        if (!pendingUserId) return;

        const user = get().allUsers.find((u) => u.id === pendingUserId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            pendingTwoFactorUserId: null
          });
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, pendingTwoFactorUserId: null });
      },
      addUser: (user) => {
        set((state) => ({
          allUsers: [...state.allUsers, user],
        }));
        triggerAutoSync(); // Auto sync after adding user
      },
      updateUser: (id, updates) => {
        set((state) => ({
          allUsers: state.allUsers.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
        }));
        triggerAutoSync(); // Auto sync after updating user
      },
      deleteUser: (id) => {
        set((state) => ({
          allUsers: state.allUsers.filter((u) => u.id !== id),
        }));
        triggerAutoSync(); // Auto sync after deleting user
      },
      toggleUserActive: (id) => {
        set((state) => ({
          allUsers: state.allUsers.map((u) =>
            u.id === id ? { ...u, isActive: !u.isActive } : u
          ),
        }));
        triggerAutoSync(); // Auto sync after toggling user active status
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
      closeWorkday: async () => {
        try {
          const currentUser = get().user;
          if (!currentUser) {
            console.error("[AuthStore] No user logged in");
            return false;
          }

          const closedAt = new Date();
          const updatedUser = {
            ...currentUser,
            workdayStatus: "closed" as const,
            workdayClosedAt: closedAt,
          };

          set({ user: updatedUser });

          // Sync to web portal
          const result = await webAdminAPI.closeWorkday(currentUser.id, closedAt);
          return result.success;
        } catch (error) {
          console.error("[AuthStore] Failed to close workday:", error);
          return false;
        }
      },
      openWorkday: async (userId: string, reason: string, adminId: string) => {
        try {
          const result = await webAdminAPI.openWorkday(userId, reason, adminId);
          if (result.success) {
            // Update local state
            const currentUser = get().user;
            if (currentUser && currentUser.id === userId) {
              set({
                user: {
                  ...currentUser,
                  workdayStatus: "open",
                  workdayClosedAt: undefined,
                  workdayOpenedBy: adminId,
                  workdayReopenReason: reason,
                },
              });
            }
          }
          return result.success;
        } catch (error) {
          console.error("[AuthStore] Failed to open workday:", error);
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
        pendingTwoFactorUserId: state.pendingTwoFactorUserId,
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

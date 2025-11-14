export type UserRole = "gospodar" | "super_user" | "technician";

export interface User {
  id: string;
  charismaId: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  depot: string;
  isActive: boolean;
  createdAt: Date | string;
  lastLoginAt?: Date | string; // Poslednje vreme logovanja
  lastLoginDevice?: string; // Informacije o uređaju (npr. "iPhone 13, iOS 16.2")
  isOnline?: boolean; // Da li je trenutno online
  twoFactorEnabled?: boolean; // Da li je 2FA omogućen
  twoFactorSecret?: string; // TOTP secret (enkriptovan)
  backupCodes?: string[]; // Backup kodovi za 2FA (hašovani)
}

export interface SparePart {
  id: string;
  name: string;
  quantity: number;
}

export interface Operation {
  id: string;
  name: string;
  description?: string;
}

export interface ServiceTicket {
  id: string;
  serviceNumber: string; // Format: {CharismaId}_1001, {CharismaId}_1002, itd.
  deviceCode: string;
  deviceLocation?: string;
  technicianId: string;
  technicianName: string;
  startTime: Date | string;
  endTime?: Date | string;
  durationMinutes?: number; // Trajanje servisa u minutima
  status: "in_progress" | "completed" | "cancelled";
  operations: Operation[];
  spareParts: SparePart[];
  notes?: string;
  cancellationReason?: string; // Razlog poništavanja servisa
}

export interface SyncData {
  users?: User[];
  tickets?: ServiceTicket[];
}

// Configuration items (master data)
export interface OperationTemplate {
  id: string;
  code: string; // Šifra operacije
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date | string;
}

export interface SparePartTemplate {
  id: string;
  code: string; // Šifra rezervnog dela
  name: string;
  unit: string; // e.g., "kom", "par", "set"
  isActive: boolean;
  createdAt: Date | string;
}

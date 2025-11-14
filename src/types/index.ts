export type UserRole = "gospodar" | "super_user" | "technician";

export interface User {
  id: string;
  charismaId: string;
  username: string;
  name: string;
  role: UserRole;
  depot: string;
  isActive: boolean;
  createdAt: Date;
  workdayStatus?: "open" | "closed";
  workdayClosedAt?: Date | string;
  workdayOpenedBy?: string; // User ID who reopened the workday
  workdayReopenReason?: string; // Reason for reopening
  twoFactorEnabled?: boolean; // 2FA enabled by admin
  twoFactorEnabledAt?: Date | string; // When 2FA was enabled
  twoFactorEnabledBy?: string; // Admin who enabled it
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
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number; // Trajanje servisa u minutima
  status: "in_progress" | "completed";
  operations: Operation[];
  spareParts: SparePart[];
  notes?: string;
}

// Configuration items (master data from web admin)
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
  unit: string;
  isActive: boolean;
  createdAt: Date | string;
}

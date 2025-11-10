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

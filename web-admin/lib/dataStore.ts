import { User, ServiceTicket, OperationTemplate, SparePartTemplate } from "../types";

// In-memory storage (would be database in production)
let users: User[] = [];
let tickets: ServiceTicket[] = [];
let operations: OperationTemplate[] = [
  { id: "1", code: "OP-001", name: "Čišćenje rezervoara", description: "Kompletno čišćenje rezervoara za vodu", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "2", code: "OP-002", name: "Zamena filtera", description: "Zamena filter uloška", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "3", code: "OP-003", name: "Provera slavina", description: "Provera funkcionalnosti slavina", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "4", code: "OP-004", name: "Provera sistema hlađenja", description: "Provera hladnjaka i kompresora", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "5", code: "OP-005", name: "Provera grejača", description: "Provera funkcije grejanja vode", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "6", code: "OP-006", name: "Zamena cevi", description: "Zamena silikonskih cevi", isActive: true, createdAt: new Date("2024-01-01") },
];

let spareParts: SparePartTemplate[] = [
  { id: "1", code: "RD-001", name: "Filter uložak", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "2", code: "RD-002", name: "Slavina za hladnu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "3", code: "RD-003", name: "Slavina za toplu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "4", code: "RD-004", name: "Silikonske cevi", unit: "m", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "5", code: "RD-005", name: "Grejač", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "6", code: "RD-006", name: "Termostat", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
];

export const dataStore = {
  // Users
  getUsers: () => users,
  setUsers: (newUsers: User[]) => {
    users = newUsers;
  },
  addUser: (user: User) => {
    users.push(user);
  },
  updateUser: (id: string, updates: Partial<User>) => {
    users = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
  },
  deleteUser: (id: string) => {
    users = users.filter((u) => u.id !== id);
  },

  // Tickets
  getTickets: () => tickets,
  setTickets: (newTickets: ServiceTicket[]) => {
    tickets = newTickets;
  },
  addTicket: (ticket: ServiceTicket) => {
    tickets.push(ticket);
  },

  // Operations
  getOperations: () => operations,
  addOperation: (operation: OperationTemplate) => {
    operations.push(operation);
  },
  updateOperation: (id: string, updates: Partial<OperationTemplate>) => {
    operations = operations.map((op) => (op.id === id ? { ...op, ...updates } : op));
  },
  deleteOperation: (id: string) => {
    operations = operations.filter((op) => op.id !== id);
  },

  // Spare Parts
  getSpareParts: () => spareParts,
  addSparePart: (sparePart: SparePartTemplate) => {
    spareParts.push(sparePart);
  },
  updateSparePart: (id: string, updates: Partial<SparePartTemplate>) => {
    spareParts = spareParts.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp));
  },
  deleteSparePart: (id: string) => {
    spareParts = spareParts.filter((sp) => sp.id !== id);
  },

  // Auth
  authenticateUser: (username: string, password: string) => {
    const user = users.find(
      (u) => u.username === username && u.password === password && u.isActive
    );
    if (user && user.role === "super_user") {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
};

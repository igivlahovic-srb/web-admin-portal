import { User, ServiceTicket, OperationTemplate, SparePartTemplate } from "../types";
import fs from "fs";
import path from "path";

// Data directory path
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const OPERATIONS_FILE = path.join(DATA_DIR, "operations.json");
const SPARE_PARTS_FILE = path.join(DATA_DIR, "spare-parts.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default data
const DEFAULT_USERS: User[] = [
  {
    id: "1",
    charismaId: "ADMIN001",
    username: "admin",
    password: "admin123",
    name: "Administrator",
    role: "super_user",
    depot: "Central",
    isActive: true,
    createdAt: new Date("2024-01-01"),
  },
];

const DEFAULT_OPERATIONS: OperationTemplate[] = [
  { id: "1", code: "OP-001", name: "Čišćenje rezervoara", description: "Kompletno čišćenje rezervoara za vodu", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "2", code: "OP-002", name: "Zamena filtera", description: "Zamena filter uloška", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "3", code: "OP-003", name: "Provera slavina", description: "Provera funkcionalnosti slavina", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "4", code: "OP-004", name: "Provera sistema hlađenja", description: "Provera hladnjaka i kompresora", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "5", code: "OP-005", name: "Provera grejača", description: "Provera funkcije grejanja vode", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "6", code: "OP-006", name: "Zamena cevi", description: "Zamena silikonskih cevi", isActive: true, createdAt: new Date("2024-01-01") },
];

const DEFAULT_SPARE_PARTS: SparePartTemplate[] = [
  { id: "1", code: "RD-001", name: "Filter uložak", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "2", code: "RD-002", name: "Slavina za hladnu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "3", code: "RD-003", name: "Slavina za toplu vodu", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "4", code: "RD-004", name: "Silikonske cevi", unit: "m", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "5", code: "RD-005", name: "Grejač", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "6", code: "RD-006", name: "Termostat", unit: "kom", isActive: true, createdAt: new Date("2024-01-01") },
];

// Helper functions to read/write JSON files
function readJSONFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJSONFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Load data from files (or use defaults)
let users: User[] = readJSONFile(USERS_FILE, DEFAULT_USERS);
let tickets: ServiceTicket[] = readJSONFile(TICKETS_FILE, []);
let operations: OperationTemplate[] = readJSONFile(OPERATIONS_FILE, DEFAULT_OPERATIONS);
let spareParts: SparePartTemplate[] = readJSONFile(SPARE_PARTS_FILE, DEFAULT_SPARE_PARTS);

// Save initial data if files do not exist
if (!fs.existsSync(USERS_FILE)) {
  writeJSONFile(USERS_FILE, users);
}
if (!fs.existsSync(OPERATIONS_FILE)) {
  writeJSONFile(OPERATIONS_FILE, operations);
}
if (!fs.existsSync(SPARE_PARTS_FILE)) {
  writeJSONFile(SPARE_PARTS_FILE, spareParts);
}
if (!fs.existsSync(TICKETS_FILE)) {
  writeJSONFile(TICKETS_FILE, tickets);
}

export const dataStore = {
  // Users
  getUsers: () => users,
  setUsers: (newUsers: User[]) => {
    users = newUsers;
    writeJSONFile(USERS_FILE, users);
  },
  addUser: (user: User) => {
    users.push(user);
    writeJSONFile(USERS_FILE, users);
  },
  updateUser: (id: string, updates: Partial<User>) => {
    users = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
    writeJSONFile(USERS_FILE, users);
  },
  deleteUser: (id: string) => {
    users = users.filter((u) => u.id !== id);
    writeJSONFile(USERS_FILE, users);
  },

  // Tickets
  getTickets: () => tickets,
  setTickets: (newTickets: ServiceTicket[]) => {
    tickets = newTickets;
    writeJSONFile(TICKETS_FILE, tickets);
  },
  addTicket: (ticket: ServiceTicket) => {
    tickets.push(ticket);
    writeJSONFile(TICKETS_FILE, tickets);
  },

  // Operations
  getOperations: () => operations,
  addOperation: (operation: OperationTemplate) => {
    operations.push(operation);
    writeJSONFile(OPERATIONS_FILE, operations);
  },
  updateOperation: (id: string, updates: Partial<OperationTemplate>) => {
    operations = operations.map((op) => (op.id === id ? { ...op, ...updates } : op));
    writeJSONFile(OPERATIONS_FILE, operations);
  },
  deleteOperation: (id: string) => {
    operations = operations.filter((op) => op.id !== id);
    writeJSONFile(OPERATIONS_FILE, operations);
  },

  // Spare Parts
  getSpareParts: () => spareParts,
  addSparePart: (sparePart: SparePartTemplate) => {
    spareParts.push(sparePart);
    writeJSONFile(SPARE_PARTS_FILE, spareParts);
  },
  updateSparePart: (id: string, updates: Partial<SparePartTemplate>) => {
    spareParts = spareParts.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp));
    writeJSONFile(SPARE_PARTS_FILE, spareParts);
  },
  deleteSparePart: (id: string) => {
    spareParts = spareParts.filter((sp) => sp.id !== id);
    writeJSONFile(SPARE_PARTS_FILE, spareParts);
  },

  // Auth
  authenticateUser: (username: string, password: string) => {
    const user = users.find(
      (u) => u.username === username && u.password === password && u.isActive
    );
    if (user && (user.role === "super_user" || user.role === "gospodar")) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
};

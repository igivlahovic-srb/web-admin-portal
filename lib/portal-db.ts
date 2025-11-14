import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// SQLite Configuration for Portal's own database
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "portal.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: Database.Database | null = null;

/**
 * Get or create Portal SQLite database connection
 */
export function getPortalDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    console.log("✓ Connected to Portal SQLite database at:", DB_PATH);

    // Enable foreign keys
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL"); // Better performance

    // Initialize schema if not exists
    initializeSchema();
  }
  return db;
}

/**
 * Initialize database schema
 */
function initializeSchema() {
  const db = getPortalDB();

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      charismaId TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_user', 'gospodar', 'technician')),
      depot TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      workdayStatus TEXT CHECK (workdayStatus IN ('open', 'closed')),
      workdayClosedAt TEXT,
      workdayOpenedBy TEXT,
      workdayReopenReason TEXT,
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workdayOpenedBy) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_charismaId ON users(charismaId);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // Service Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_tickets (
      id TEXT PRIMARY KEY,
      ticketNumber TEXT UNIQUE NOT NULL,
      technicianId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      customerAddress TEXT,
      deviceType TEXT,
      deviceSerialNumber TEXT,
      problemDescription TEXT,
      status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'cancelled')),
      startTime TEXT NOT NULL,
      endTime TEXT,
      durationMinutes INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (technicianId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status ON service_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_technician ON service_tickets(technicianId);
    CREATE INDEX IF NOT EXISTS idx_tickets_startTime ON service_tickets(startTime);
    CREATE INDEX IF NOT EXISTS idx_tickets_number ON service_tickets(ticketNumber);
  `);

  // Operation Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_templates (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_operations_code ON operation_templates(code);
    CREATE INDEX IF NOT EXISTS idx_operations_active ON operation_templates(isActive);
  `);

  // Spare Part Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spare_part_templates (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_spare_parts_code ON spare_part_templates(code);
    CREATE INDEX IF NOT EXISTS idx_spare_parts_active ON spare_part_templates(isActive);
  `);

  // Ticket Operations (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_operations (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      operationId TEXT NOT NULL,
      operationCode TEXT,
      operationName TEXT,
      operationDescription TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticketId) REFERENCES service_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (operationId) REFERENCES operation_templates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_ops_ticket ON ticket_operations(ticketId);
  `);

  // Ticket Spare Parts (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_spare_parts (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      sparePartId TEXT NOT NULL,
      sparePartCode TEXT,
      sparePartName TEXT,
      quantity REAL NOT NULL,
      unit TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticketId) REFERENCES service_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (sparePartId) REFERENCES spare_part_templates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_parts_ticket ON ticket_spare_parts(ticketId);
  `);

  // Workday Log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workday_log (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('opened', 'closed')),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      openedBy TEXT,
      reason TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (openedBy) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_workday_user ON workday_log(userId);
    CREATE INDEX IF NOT EXISTS idx_workday_timestamp ON workday_log(timestamp);
  `);

  console.log("✓ Portal database schema initialized");
}

/**
 * Execute a SQL query (SELECT)
 */
export function query<T = any>(sql: string, params?: any[]): T[] {
  try {
    const db = getPortalDB();
    const stmt = db.prepare(sql);
    const result = params ? stmt.all(...params) : stmt.all();
    return result as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a SQL statement (INSERT, UPDATE, DELETE)
 */
export function exec(sql: string, params?: any[]): Database.RunResult {
  try {
    const db = getPortalDB();
    const stmt = db.prepare(sql);
    const result = params ? stmt.run(...params) : stmt.run();
    return result;
  } catch (error) {
    console.error("Database execution error:", error);
    throw error;
  }
}

/**
 * Get a single row
 */
export function get<T = any>(sql: string, params?: any[]): T | undefined {
  try {
    const db = getPortalDB();
    const stmt = db.prepare(sql);
    const result = params ? stmt.get(...params) : stmt.get();
    return result as T | undefined;
  } catch (error) {
    console.error("Database get error:", error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export function transaction<T>(fn: () => T): T {
  const db = getPortalDB();
  const txn = db.transaction(fn);
  return txn();
}

/**
 * Close the database connection
 */
export function closePortalDB(): void {
  if (db) {
    db.close();
    db = null;
    console.log("✓ Portal SQLite database connection closed");
  }
}

// Handle process termination
process.on("SIGINT", () => {
  closePortalDB();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closePortalDB();
  process.exit(0);
});

export default {
  getPortalDB,
  query,
  exec,
  get,
  transaction,
  closePortalDB,
};

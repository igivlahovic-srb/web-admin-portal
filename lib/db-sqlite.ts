import Database from "better-sqlite3";
import path from "path";

// SQLite Configuration
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "lafantana.db");

let db: Database.Database | null = null;

/**
 * Get or create SQLite database connection
 */
export function getDB(): Database.Database {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    console.log("✓ Connected to SQLite database at:", dbPath);

    // Enable foreign keys
    db.pragma("foreign_keys = ON");
  }
  return db;
}

/**
 * Execute a SQL query (for SELECT)
 * @param query SQL query string
 * @param params Optional parameters array
 */
export function query<T = any>(query: string, params?: any[]): T[] {
  try {
    const db = getDB();
    const stmt = db.prepare(query);
    const result = params ? stmt.all(...params) : stmt.all();
    return result as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a SQL statement (for INSERT, UPDATE, DELETE)
 * @param query SQL query string
 * @param params Optional parameters array
 */
export function exec(query: string, params?: any[]): Database.RunResult {
  try {
    const db = getDB();
    const stmt = db.prepare(query);
    const result = params ? stmt.run(...params) : stmt.run();
    return result;
  } catch (error) {
    console.error("Database execution error:", error);
    throw error;
  }
}

/**
 * Execute a transaction
 * @param fn Transaction function
 */
export function transaction<T>(fn: () => T): T {
  const db = getDB();
  const txn = db.transaction(fn);
  return txn();
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
    console.log("✓ SQLite database connection closed");
  }
}

// Handle process termination
process.on("SIGINT", () => {
  closeDB();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeDB();
  process.exit(0);
});

export default {
  getDB,
  query,
  exec,
  transaction,
  closeDB,
};

import { Pool, QueryResult, QueryResultRow } from "pg";

// PostgreSQL Configuration
const config = {
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
  host: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "lafantana_whs",
  port: parseInt(process.env.DB_PORT || "5432"),
  max: 10, // max number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
};

// Create a connection pool
let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 */
export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = new Pool(config);

    // Test connection
    try {
      const client = await pool.connect();
      console.log("✓ Connected to PostgreSQL database");
      client.release();
    } catch (error) {
      console.error("✗ Failed to connect to PostgreSQL:", error);
      throw error;
    }
  }
  return pool;
}

/**
 * Execute a SQL query
 * @param query SQL query string
 * @param params Optional parameters array
 */
export async function query<T extends QueryResultRow = any>(
  query: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const pool = await getPool();
    const result = await pool.query<T>(query, params);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✓ PostgreSQL connection pool closed");
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closePool();
  process.exit(0);
});

export default {
  getPool,
  query,
  closePool,
};

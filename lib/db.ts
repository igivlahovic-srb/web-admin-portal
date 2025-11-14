import sql from "mssql";

// MS SQL Configuration
// Set these values in your environment variables or update directly
const config: sql.config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "your_password",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "your_database",
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // for Azure
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false", // change to true for local dev / self-signed certs
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
};

// Create a connection pool
let pool: sql.ConnectionPool | null = null;

/**
 * Get or create MS SQL connection pool
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✓ Connected to MS SQL database");
  }
  return pool;
}

/**
 * Execute a SQL query
 * @param query SQL query string
 * @param params Optional parameters object
 */
export async function query<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<sql.IResult<T>> {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters if provided
    if (params) {
      Object.keys(params).forEach((key) => {
        request.input(key, params[key]);
      });
    }

    const result = await request.query<T>(query);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a stored procedure
 * @param procedureName Name of the stored procedure
 * @param params Optional parameters object
 */
export async function executeProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<sql.IResult<T>> {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters if provided
    if (params) {
      Object.keys(params).forEach((key) => {
        request.input(key, params[key]);
      });
    }

    const result = await request.execute<T>(procedureName);
    return result;
  } catch (error) {
    console.error("Stored procedure execution error:", error);
    throw error;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("✓ MS SQL connection pool closed");
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
  executeProcedure,
  closePool,
};

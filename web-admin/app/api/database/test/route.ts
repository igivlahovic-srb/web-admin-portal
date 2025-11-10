import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../lib/db";

/**
 * Example API route for MS SQL database queries
 *
 * GET /api/database/test - Test database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DB_SERVER || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: "Database nije konfigurisan. Idite na Konfiguracija → Povezivanje sa Bazom i sačuvajte podešavanja.",
        },
        { status: 400 }
      );
    }

    // Test query to check connection
    const result = await query("SELECT @@VERSION AS Version, GETDATE() AS CurrentDateTime");

    return NextResponse.json({
      success: true,
      message: "Konekcija uspešna!",
      data: result.recordset[0],
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Database connection failed: ${error.message}`,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Example POST endpoint for executing custom queries
 *
 * POST /api/database/test
 * Body: { "query": "SELECT * FROM Users WHERE id = @id", "params": { "id": 1 } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query: sqlQuery, params } = body;

    if (!sqlQuery) {
      return NextResponse.json(
        {
          success: false,
          message: "SQL query is required",
        },
        { status: 400 }
      );
    }

    // Execute the query
    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      message: "Query executed successfully",
      data: result.recordset,
      rowsAffected: result.rowsAffected[0],
    });
  } catch (error: any) {
    console.error("Database query error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Query execution failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

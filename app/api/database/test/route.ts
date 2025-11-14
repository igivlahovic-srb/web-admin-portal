import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../lib/db";

/**
 * Example API route for MS SQL database queries
 *
 * GET /api/database/test - Test database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Try to read .env.local directly to check if config exists
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');

    let hasConfigFile = false;
    let envContent = '';

    try {
      envContent = fs.readFileSync(envPath, 'utf-8');
      hasConfigFile = envContent.includes('DB_SERVER=') &&
                      envContent.includes('DB_NAME=') &&
                      envContent.includes('DB_USER=') &&
                      envContent.includes('DB_PASSWORD=');
    } catch {
      hasConfigFile = false;
    }

    // Check if database is configured in process.env
    const isConfiguredInEnv = process.env.DB_SERVER &&
                              process.env.DB_NAME &&
                              process.env.DB_USER &&
                              process.env.DB_PASSWORD;

    if (!isConfiguredInEnv) {
      if (hasConfigFile) {
        return NextResponse.json(
          {
            success: false,
            message: "Database je konfigurisan u .env.local fajlu, ali Next.js server mora biti restartovan da učita nove vrednosti.",
            needsRestart: true,
            instruction: "Restartujte server: Ctrl+C pa opet 'npm run dev'",
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Database nije konfigurisan. Idite na Konfiguracija → Povezivanje sa Bazom i sačuvajte podešavanja.",
            needsRestart: false,
          },
          { status: 400 }
        );
      }
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

    // Provide more detailed error messages
    let errorMessage = `Database connection failed: ${error.message}`;
    let troubleshooting = [];

    if (error.message?.includes("Could not connect")) {
      troubleshooting.push("- Proverite da li je SQL Server pokrenut na " + process.env.DB_SERVER);
      troubleshooting.push("- Proverite firewall podešavanja (port " + (process.env.DB_PORT || "1433") + ")");
      troubleshooting.push("- Proverite da li je TCP/IP protokol omogućen u SQL Server Configuration Manager");
    } else if (error.message?.includes("Login failed")) {
      troubleshooting.push("- Proverite korisničko ime i lozinku");
      troubleshooting.push("- Proverite da li korisnik ima pristup bazi " + process.env.DB_NAME);
    } else if (error.message?.includes("Cannot open database")) {
      troubleshooting.push("- Proverite da li baza podataka " + process.env.DB_NAME + " postoji");
      troubleshooting.push("- Proverite dozvole korisnika");
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: error.message,
        config: {
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          port: process.env.DB_PORT || "1433",
        },
        troubleshooting: troubleshooting.length > 0 ? troubleshooting : undefined,
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

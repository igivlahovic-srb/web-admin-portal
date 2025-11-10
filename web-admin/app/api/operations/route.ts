import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";

/**
 * API endpoint to fetch operations from SQL database
 * Fetches items with ItemCode starting with "OP"
 */
export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DB_SERVER || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: "Database nije konfigurisan. Idite na Konfiguracija → Povezivanje sa Bazom...",
        },
        { status: 400 }
      );
    }

    // Execute query to fetch operations (ItemCode starting with "OP")
    const result = await query(`
      SELECT DISTINCT
        i.ItemId,
        i.ItemCode AS Sifra,
        i.ItemName AS Naziv,
        'Aktivan' AS Status
      FROM Item i
      WHERE LEFT(i.ItemCode, 2) = 'OP'
        AND i.Enabled = 1
        AND i.IsStockable = 0
      ORDER BY i.ItemCode
    `);

    const operations = result.recordset.map((item: any) => ({
      id: item.ItemId?.toString() || '',
      code: item.Sifra || '',
      name: item.Naziv || '',
      status: item.Status || 'Aktivan',
    }));

    return NextResponse.json({
      success: true,
      message: `Učitano ${operations.length} operacija`,
      data: { operations },
    });
  } catch (error: any) {
    console.error("Error fetching operations from database:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Greška pri učitavanju operacija: ${error.message}`,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

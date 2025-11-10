import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../lib/db";

/**
 * API endpoint to fetch spare parts from SQL database
 * Fetches items with ItemCode starting with "102"
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

    // Execute query to fetch spare parts (ItemCode starting with "102")
    const result = await query(`
      SELECT DISTINCT
        i.ItemId,
        i.ItemCode AS Sifra,
        i.ItemName AS Naziv,
        'Aktivan' AS Status
      FROM Item i
      WHERE LEFT(i.ItemCode, 3) = '102'
        AND i.Enabled = 1
        AND i.IsStockable = 1
      ORDER BY i.ItemCode
    `);

    const spareParts = result.recordset.map((item: any) => ({
      id: item.ItemId?.toString() || '',
      code: item.Sifra || '',
      name: item.Naziv || '',
      status: item.Status || 'Aktivan',
    }));

    return NextResponse.json({
      success: true,
      message: `Učitano ${spareParts.length} rezervnih delova`,
      data: { spareParts },
    });
  } catch (error: any) {
    console.error("Error fetching spare parts from database:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Greška pri učitavanju rezervnih delova: ${error.message}`,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

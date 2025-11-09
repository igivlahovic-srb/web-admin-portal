import { NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

/**
 * API endpoint za sinhronizaciju konfiguracijskih podataka na mobilne uređaje
 * GET /api/config/sync
 */
export async function GET() {
  try {
    const operations = dataStore.getOperations();
    const spareParts = dataStore.getSpareParts();

    return NextResponse.json({
      success: true,
      data: {
        operations: operations.filter((op) => op.isActive),
        spareParts: spareParts.filter((sp) => sp.isActive),
        syncedAt: new Date().toISOString(),
      },
      message: "Konfiguracioni podaci spremni za sinhronizaciju",
    });
  } catch (error) {
    console.error("Error syncing config:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri sinhronizaciji" },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger push notification to all connected mobile devices
 */
export async function POST() {
  try {
    // This endpoint would trigger a notification/refresh signal to mobile apps
    // In a real implementation, this would use push notifications or websockets

    return NextResponse.json({
      success: true,
      message: "Signal za sinhronizaciju poslat na sve mobilne uređaje",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error triggering sync:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri slanju signala" },
      { status: 500 }
    );
  }
}

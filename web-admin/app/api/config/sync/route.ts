import { NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

/**
 * GET - Get configuration data for sync
 * Query params: ?type=operations|spareParts (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const operations = dataStore.getOperations();
    const spareParts = dataStore.getSpareParts();

    let responseData: any = {
      syncedAt: new Date().toISOString(),
    };

    // If type is specified, only return that type
    if (type === "operations") {
      responseData.operations = operations.filter((op) => op.isActive);
    } else if (type === "spareParts") {
      responseData.spareParts = spareParts.filter((sp) => sp.isActive);
    } else {
      // Return both if no type specified
      responseData.operations = operations.filter((op) => op.isActive);
      responseData.spareParts = spareParts.filter((sp) => sp.isActive);
    }

    return NextResponse.json({
      success: true,
      data: responseData,
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
 * POST - Trigger push notification to mobile devices
 * Query params: ?type=operations|spareParts (optional)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let message = "Signal za sinhronizaciju poslat na sve mobilne uređaje";

    if (type === "operations") {
      message = "Operacije poslate na sve mobilne uređaje";
    } else if (type === "spareParts") {
      message = "Rezervni delovi poslati na sve mobilne uređaje";
    }

    // This endpoint would trigger a notification/refresh signal to mobile apps
    // In a real implementation, this would use push notifications or websockets

    return NextResponse.json({
      success: true,
      message,
      type: type || "all",
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

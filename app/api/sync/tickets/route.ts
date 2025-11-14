import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

export async function POST(req: NextRequest) {
  try {
    console.log("[SYNC] Received POST request to /api/sync/tickets");
    const body = await req.json();
    console.log("[SYNC] Request body:", JSON.stringify(body).substring(0, 200));
    const { tickets } = body;

    if (!tickets || !Array.isArray(tickets)) {
      console.log("[SYNC] Invalid tickets data - not an array");
      return NextResponse.json(
        { success: false, message: "Invalid tickets data" },
        { status: 400 }
      );
    }

    console.log(`[SYNC] Syncing ${tickets.length} tickets to dataStore`);
    dataStore.setTickets(tickets);
    console.log("[SYNC] Tickets synced successfully");

    return NextResponse.json({
      success: true,
      message: "Tickets synced successfully",
      data: { count: tickets.length },
    });
  } catch (error) {
    console.error("[SYNC] Error syncing tickets:", error);
    return NextResponse.json(
      { success: false, message: "Failed to sync tickets" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tickets = dataStore.getTickets();
    return NextResponse.json({
      success: true,
      data: { tickets },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

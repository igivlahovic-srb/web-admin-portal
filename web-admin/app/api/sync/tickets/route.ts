import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickets } = body;

    if (!tickets || !Array.isArray(tickets)) {
      return NextResponse.json(
        { success: false, message: "Invalid tickets data" },
        { status: 400 }
      );
    }

    dataStore.setTickets(tickets);

    return NextResponse.json({
      success: true,
      message: "Tickets synced successfully",
      data: { count: tickets.length },
    });
  } catch (error) {
    console.error("Error syncing tickets:", error);
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

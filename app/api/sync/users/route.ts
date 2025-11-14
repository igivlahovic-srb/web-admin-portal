import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

export async function POST(req: NextRequest) {
  try {
    console.log("[SYNC] Received POST request to /api/sync/users");
    const body = await req.json();
    console.log("[SYNC] Request body:", JSON.stringify(body).substring(0, 200));
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      console.log("[SYNC] Invalid users data - not an array");
      return NextResponse.json(
        { success: false, message: "Invalid users data" },
        { status: 400 }
      );
    }

    console.log(`[SYNC] Syncing ${users.length} users to dataStore`);
    dataStore.setUsers(users);
    console.log("[SYNC] Users synced successfully");

    return NextResponse.json({
      success: true,
      message: "Users synced successfully",
      data: { count: users.length },
    });
  } catch (error) {
    console.error("[SYNC] Error syncing users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to sync users" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const users = dataStore.getUsers();
    return NextResponse.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

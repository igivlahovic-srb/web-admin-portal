import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { success: false, message: "Invalid users data" },
        { status: 400 }
      );
    }

    dataStore.setUsers(users);

    return NextResponse.json({
      success: true,
      message: "Users synced successfully",
      data: { count: users.length },
    });
  } catch (error) {
    console.error("Error syncing users:", error);
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

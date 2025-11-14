import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "..", "data", "users.json");

export async function POST(req: NextRequest) {
  try {
    const { userId, closedAt } = await req.json();

    if (!userId || !closedAt) {
      return NextResponse.json(
        { success: false, message: "userId and closedAt are required" },
        { status: 400 }
      );
    }

    // Read existing users
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      const fileContent = fs.readFileSync(USERS_FILE, "utf-8");
      const data = JSON.parse(fileContent);
      users = data.users || [];
    }

    // Update user workday status
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      workdayStatus: "closed",
      workdayClosedAt: closedAt,
    };

    // Save updated users
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify({ users }, null, 2),
      "utf-8"
    );

    console.log(`[API] Workday closed for user ${userId} at ${closedAt}`);

    return NextResponse.json({
      success: true,
      message: "Workday closed successfully",
      data: { user: users[userIndex] },
    });
  } catch (error) {
    console.error("[API] Error closing workday:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

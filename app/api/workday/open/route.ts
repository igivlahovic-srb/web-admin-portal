import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "..", "data", "users.json");
const WORKDAY_LOG_FILE = path.join(process.cwd(), "..", "data", "workday-log.json");

export async function POST(req: NextRequest) {
  try {
    const { userId, reason, adminId } = await req.json();

    if (!userId || !reason || !adminId) {
      return NextResponse.json(
        { success: false, message: "userId, reason, and adminId are required" },
        { status: 400 }
      );
    }

    // Validate reason length (minimum 10 characters)
    if (reason.length < 10) {
      return NextResponse.json(
        { success: false, message: "Reason must be at least 10 characters long" },
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

    // Find the user
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Find admin
    const admin = users.find((u: any) => u.id === adminId);
    if (!admin || (admin.role !== "super_user" && admin.role !== "gospodar")) {
      return NextResponse.json(
        { success: false, message: "Only admins can reopen workdays" },
        { status: 403 }
      );
    }

    // Update user workday status
    users[userIndex] = {
      ...users[userIndex],
      workdayStatus: "open",
      workdayClosedAt: undefined,
      workdayOpenedBy: adminId,
      workdayReopenReason: reason,
    };

    // Save updated users
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify({ users }, null, 2),
      "utf-8"
    );

    // Log the workday reopening
    let logs = [];
    if (fs.existsSync(WORKDAY_LOG_FILE)) {
      const logContent = fs.readFileSync(WORKDAY_LOG_FILE, "utf-8");
      logs = JSON.parse(logContent);
    }

    logs.push({
      id: Date.now().toString(),
      userId,
      userName: users[userIndex].name,
      adminId,
      adminName: admin.name,
      reason,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(WORKDAY_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");

    console.log(`[API] Workday reopened for user ${userId} by admin ${adminId}`);

    return NextResponse.json({
      success: true,
      message: "Workday reopened successfully",
      data: { user: users[userIndex] },
    });
  } catch (error) {
    console.error("[API] Error reopening workday:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Get workday reopening log
export async function GET() {
  try {
    if (!fs.existsSync(WORKDAY_LOG_FILE)) {
      return NextResponse.json({ success: true, data: { logs: [] } });
    }

    const logContent = fs.readFileSync(WORKDAY_LOG_FILE, "utf-8");
    const logs = JSON.parse(logContent);

    return NextResponse.json({ success: true, data: { logs } });
  } catch (error) {
    console.error("[API] Error fetching workday log:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

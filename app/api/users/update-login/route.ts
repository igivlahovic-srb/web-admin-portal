import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { User } from "../../../../types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deviceInfo, isOnline } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId je obavezan" },
        { status: 400 }
      );
    }

    const usersPath = join(process.cwd(), "data", "users.json");

    // Read current users
    const usersData = JSON.parse(readFileSync(usersPath, "utf-8"));
    const users: User[] = Array.isArray(usersData)
      ? usersData
      : usersData.users || [];

    // Find user
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    // Update user login info
    users[userIndex] = {
      ...users[userIndex],
      lastLoginAt: new Date().toISOString(),
      lastLoginDevice: deviceInfo || users[userIndex].lastLoginDevice,
      isOnline: isOnline !== undefined ? isOnline : true,
    };

    // Write back to file
    writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return NextResponse.json({
      success: true,
      message: "Login informacije ažurirane",
      user: users[userIndex],
    });
  } catch (error) {
    console.error("Error updating login info:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri ažuriranju login informacija",
      },
      { status: 500 }
    );
  }
}

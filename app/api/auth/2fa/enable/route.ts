import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { User } from "../../../../../types";
import speakeasy from "speakeasy";
import crypto from "crypto";

// Hash backup code
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, secret, backupCodes } = body;

    if (!userId || !token || !secret) {
      return NextResponse.json(
        { success: false, message: "Svi parametri su obavezni" },
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time steps before and after
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, message: "Nevažeći kod. Pokušajte ponovo." },
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

    // Hash the backup codes
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // Update user with 2FA enabled
    users[userIndex] = {
      ...users[userIndex],
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: hashedBackupCodes,
    };

    // Write back to file
    writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return NextResponse.json({
      success: true,
      message: "2FA je uspešno omogućen!",
    });
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri omogućavanju 2FA",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

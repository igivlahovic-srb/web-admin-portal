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
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, message: "userId i token su obavezni" },
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

    const user = users[userIndex];

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: "2FA nije omogućen za ovog korisnika" },
        { status: 400 }
      );
    }

    // Try TOTP verification first
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (verified) {
      return NextResponse.json({
        success: true,
        message: "2FA kod je verifikovan",
      });
    }

    // If TOTP fails, check backup codes
    const hashedToken = hashBackupCode(token);
    const backupCodeIndex = user.backupCodes?.findIndex(
      (code) => code === hashedToken
    );

    if (backupCodeIndex !== undefined && backupCodeIndex !== -1) {
      // Remove used backup code
      const updatedBackupCodes = [...(user.backupCodes || [])];
      updatedBackupCodes.splice(backupCodeIndex, 1);

      users[userIndex] = {
        ...user,
        backupCodes: updatedBackupCodes,
      };

      // Write back to file
      writeFileSync(usersPath, JSON.stringify(users, null, 2));

      return NextResponse.json({
        success: true,
        message: "Backup kod je verifikovan",
        isBackupCode: true,
        remainingBackupCodes: updatedBackupCodes.length,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Nevažeći 2FA kod ili backup kod",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri verifikaciji 2FA",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { User } from "../../../../../types";
import speakeasy from "speakeasy";

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

    // Verify current token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          message: "Nevažeći kod. Unesite trenutni 2FA kod da biste onemogućili 2FA.",
        },
        { status: 400 }
      );
    }

    // Disable 2FA
    users[userIndex] = {
      ...user,
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      backupCodes: undefined,
    };

    // Write back to file
    writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return NextResponse.json({
      success: true,
      message: "2FA je uspešno onemogućen",
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri onemogućavanju 2FA",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

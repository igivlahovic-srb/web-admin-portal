import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { User } from "../../../../../types";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Hash backup code
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

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
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `La Fantana WHS (${user.username})`,
      issuer: "La Fantana WHS",
      length: 32,
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url || "");

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // Return setup data (don't save yet - will save on verify)
    return NextResponse.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        backupCodes: backupCodes, // Plain text codes (show to user once)
      },
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri postavljanju 2FA",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

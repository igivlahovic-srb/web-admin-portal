import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API endpoint za restore backup-a
export async function POST(request: NextRequest) {
  try {
    // Check if running on Windows
    const isWindows = process.platform === "win32";

    if (isWindows) {
      return NextResponse.json(
        {
          success: false,
          message: "Restore funkcionalnost nije dostupna na Windows okruženju. Koristite restore samo na Ubuntu production serveru.",
          platform: process.platform,
        },
        { status: 501 } // 501 Not Implemented
      );
    }

    const body = await request.json();
    const { backupFile } = body;

    if (!backupFile) {
      return NextResponse.json(
        {
          success: false,
          message: "Naziv backup fajla nije prosleđen",
        },
        { status: 400 }
      );
    }

    const backupPath = path.join(process.cwd(), "public", "backups", backupFile);

    // Check if backup file exists
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup fajl ne postoji",
        },
        { status: 404 }
      );
    }

    // Create restore script path
    const restoreScriptPath = "/root/webadminportal/RESTORE_BACKUP.sh";

    // Check if restore script exists
    if (!fs.existsSync(restoreScriptPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Restore script ne postoji. Molimo kontaktirajte administratora.",
        },
        { status: 404 }
      );
    }

    // Run restore script in background with backup file as argument
    const { spawn } = require("child_process");
    const child = spawn("bash", [restoreScriptPath, backupPath], {
      detached: true,
      stdio: "ignore",
    });

    child.unref();

    return NextResponse.json({
      success: true,
      message: "Restore je pokrenut u pozadini. Server će se restartovati za 5 sekundi.",
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri restore-ovanju backup-a: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

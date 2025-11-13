import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API endpoint za dobavljanje liste backup-ova
export async function GET(request: NextRequest) {
  try {
    // Try multiple backup locations
    const possibleBackupDirs = [
      "/root/webadminportal/backups",
      "/root/webadminportal",
      path.join(process.cwd(), "public", "backups"),
      path.join(process.cwd(), "..", "backups"),
    ];

    let backupDir = "";
    let files: string[] = [];

    // Find the directory that contains backup files
    for (const dir of possibleBackupDirs) {
      if (fs.existsSync(dir)) {
        const dirFiles = fs
          .readdirSync(dir)
          .filter((file) => file.endsWith(".tar.gz") && file.startsWith("lafantana-whs-backup-"));

        if (dirFiles.length > 0) {
          backupDir = dir;
          files = dirFiles;
          break;
        }
      }
    }

    let backups: Array<{
      name: string;
      version: string;
      timestamp: string;
      size: number;
      date: string;
      downloadUrl: string;
    }> = [];

    if (files.length > 0) {
      // Sortiraj fajlove po vremenu modifikacije (najnoviji prvi)
      const sortedFiles = files
        .map((file) => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);

          // Parse filename: lafantana-whs-backup-v2.1.0-20251111-143000.tar.gz
          const match = file.match(/lafantana-whs-backup-v([^-]+)-(\d{8})-(\d{6})\.tar\.gz/);
          const version = match ? match[1] : "unknown";
          const dateStr = match ? match[2] : "";
          const timeStr = match ? match[3] : "";

          // Format date
          let formattedDate = stats.mtime.toISOString();
          if (dateStr && timeStr) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hour = timeStr.substring(0, 2);
            const minute = timeStr.substring(2, 4);
            formattedDate = `${day}.${month}.${year} ${hour}:${minute}`;
          }

          return {
            name: file,
            version: version,
            timestamp: `${dateStr}-${timeStr}`,
            size: stats.size,
            date: formattedDate,
            downloadUrl: `/api/backup/download?file=${encodeURIComponent(file)}`,
            time: stats.mtime.getTime(),
          };
        })
        .sort((a, b) => b.time - a.time);

      // Uzmi poslednja 3 backup-a
      backups = sortedFiles.slice(0, 3).map(({ time, ...rest }) => rest);
    }

    return NextResponse.json({
      success: true,
      data: {
        backups: backups,
        hasBackups: backups.length > 0,
        backupDir: backupDir, // Debug info
      },
    });
  } catch (error) {
    console.error("Error fetching backups:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri učitavanju backup-ova",
      },
      { status: 500 }
    );
  }
}

// API endpoint za kreiranje novog backup-a
export async function POST(request: NextRequest) {
  try {
    // Check if running on Windows
    const isWindows = process.platform === "win32";

    if (isWindows) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup funkcionalnost nije dostupna na Windows okruženju. Koristite backup samo na Ubuntu production serveru.",
          platform: process.platform,
        },
        { status: 501 } // 501 Not Implemented
      );
    }

    const { spawn } = require("child_process");

    // Try multiple possible locations for backup script
    const possibleScripts = [
      "/root/lafantana-whs-admin/CREATE_BACKUP.sh",
      "/root/webadminportal/CREATE_BACKUP.sh",
      path.join(process.cwd(), "CREATE_BACKUP.sh"),
    ];

    let backupScript = "";
    for (const script of possibleScripts) {
      if (fs.existsSync(script)) {
        backupScript = script;
        break;
      }
    }

    // Check if script exists
    if (!backupScript) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup script not found. Missing CREATE_BACKUP.sh file.",
        },
        { status: 404 }
      );
    }

    // Run backup script in background
    const child = spawn("bash", [backupScript], {
      detached: true,
      stdio: "ignore",
    });

    child.unref();

    return NextResponse.json({
      success: true,
      message: "Backup je pokrenut u pozadini. Sačekajte 1-2 minuta i refresh-ujte stranicu.",
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri kreiranju backup-a: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

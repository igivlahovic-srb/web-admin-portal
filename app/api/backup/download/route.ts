import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json(
        { success: false, message: "Filename not provided" },
        { status: 400 }
      );
    }

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json(
        { success: false, message: "Invalid filename" },
        { status: 400 }
      );
    }

    // Try multiple backup locations
    const possibleBackupDirs = [
      "/root/webadminportal/backups",
      "/root/webadminportal",
      path.join(process.cwd(), "public", "backups"),
      path.join(process.cwd(), "..", "backups"),
    ];

    let filePath = "";

    // Find the file
    for (const dir of possibleBackupDirs) {
      const testPath = path.join(dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "Backup file not found" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading backup:", error);
    return NextResponse.json(
      { success: false, message: "Error downloading backup" },
      { status: 500 }
    );
  }
}

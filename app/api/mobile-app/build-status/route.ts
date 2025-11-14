import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API endpoint za dobavljanje statusa build-a
export async function GET(request: NextRequest) {
  try {
    const apkDir = path.join(process.cwd(), "public", "apk");

    // Check if .latest-build-version and .latest-build-date exist
    const versionFile = path.join(apkDir, ".latest-build-version");
    const dateFile = path.join(apkDir, ".latest-build-date");

    let latestBuildVersion = null;
    let latestBuildDate = null;
    let buildInProgress = false;

    if (fs.existsSync(versionFile)) {
      latestBuildVersion = fs.readFileSync(versionFile, "utf-8").trim();
    }

    if (fs.existsSync(dateFile)) {
      latestBuildDate = fs.readFileSync(dateFile, "utf-8").trim();
    }

    // Check if there's a build in progress by looking for recent log files
    const logDir = "/tmp";
    const recentLogs = fs.readdirSync(logDir)
      .filter(file => file.startsWith("android-build-") && file.endsWith(".log"))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(logDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // If there's a log file less than 15 minutes old, build might be in progress
    if (recentLogs.length > 0) {
      const latestLog = recentLogs[0];
      const logAge = Date.now() - latestLog.time;
      const fifteenMinutes = 15 * 60 * 1000;

      if (logAge < fifteenMinutes) {
        buildInProgress = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        latestBuildVersion,
        latestBuildDate,
        buildInProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching build status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri učitavanju statusa build-a",
      },
      { status: 500 }
    );
  }
}

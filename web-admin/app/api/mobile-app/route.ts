import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API endpoint za dobavljanje informacija o mobilnoj aplikaciji
export async function GET(request: NextRequest) {
  try {
    const apkDir = path.join(process.cwd(), "public", "apk");

    // Kreiraj direktorijum ako ne postoji
    if (!fs.existsSync(apkDir)) {
      fs.mkdirSync(apkDir, { recursive: true });
    }

    // Pronađi sve APK fajlove
    const files = fs.readdirSync(apkDir).filter((file) => file.endsWith(".apk"));

    let latestApk = null;
    let latestVersion = null;

    if (files.length > 0) {
      // Sortiraj fajlove po vremenu modifikacije (najnoviji prvi)
      const sortedFiles = files
        .map((file) => ({
          name: file,
          time: fs.statSync(path.join(apkDir, file)).mtime.getTime(),
          size: fs.statSync(path.join(apkDir, file)).size,
        }))
        .sort((a, b) => b.time - a.time);

      const latest = sortedFiles[0];
      latestApk = latest.name;

      // Pokušaj da izvučeš verziju iz imena fajla (npr. lafantana-v2.1.0.apk)
      const versionMatch = latest.name.match(/v?(\d+\.\d+\.\d+)/);
      latestVersion = versionMatch ? versionMatch[1] : "1.0.0";
    }

    return NextResponse.json({
      success: true,
      data: {
        hasApk: files.length > 0,
        latestVersion: latestVersion || "Nije dostupno",
        downloadUrl: latestApk ? `/apk/${latestApk}` : null,
        fileName: latestApk,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching mobile app info:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri učitavanju informacija o mobilnoj aplikaciji",
      },
      { status: 500 }
    );
  }
}

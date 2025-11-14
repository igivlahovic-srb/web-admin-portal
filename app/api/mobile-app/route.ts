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
    let builds: Array<{
      name: string;
      version: string;
      size: number;
      buildDate: string;
      downloadUrl: string;
    }> = [];

    if (files.length > 0) {
      // Sortiraj fajlove po vremenu modifikacije (najnoviji prvi)
      const sortedFiles = files
        .map((file) => {
          const filePath = path.join(apkDir, file);
          const stats = fs.statSync(filePath);
          const versionMatch = file.match(/v?(\d+\.\d+\.\d+)/);
          const version = versionMatch ? versionMatch[1] : "1.0.0";

          return {
            name: file,
            version: version,
            time: stats.mtime.getTime(),
            size: stats.size,
            buildDate: stats.mtime.toISOString(),
            downloadUrl: `/apk/${file}`,
          };
        })
        .sort((a, b) => b.time - a.time);

      // Uzmi poslednja 3 build-a
      builds = sortedFiles.slice(0, 3).map(({ name, version, size, buildDate, downloadUrl }) => ({
        name,
        version,
        size,
        buildDate,
        downloadUrl,
      }));

      // Najnoviji build za backward compatibility
      const latest = sortedFiles[0];
      latestApk = latest.name;
      latestVersion = latest.version;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasApk: files.length > 0,
        latestVersion: latestVersion || "Nije dostupno",
        downloadUrl: latestApk ? `/apk/${latestApk}` : null,
        fileName: latestApk,
        updatedAt: new Date().toISOString(),
        builds: builds, // Poslednja 3 build-a sa detaljima
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

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("apk") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Nije izabran fajl" },
        { status: 400 }
      );
    }

    // Provera da li je fajl APK
    if (!file.name.endsWith(".apk")) {
      return NextResponse.json(
        { success: false, message: "Fajl mora biti APK format" },
        { status: 400 }
      );
    }

    const apkDir = path.join(process.cwd(), "public", "apk");

    // Kreiraj direktorijum ako ne postoji
    if (!fs.existsSync(apkDir)) {
      fs.mkdirSync(apkDir, { recursive: true });
    }

    // Obriši stare APK fajlove
    const existingFiles = fs.readdirSync(apkDir).filter((f) => f.endsWith(".apk"));
    existingFiles.forEach((f) => {
      fs.unlinkSync(path.join(apkDir, f));
    });

    // Sačuvaj novi fajl
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(apkDir, file.name);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: "APK fajl je uspešno uploadovan",
      data: {
        fileName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error uploading APK:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri upload-ovanju APK fajla",
      },
      { status: 500 }
    );
  }
}

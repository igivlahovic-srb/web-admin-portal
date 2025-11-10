import { NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const envPath = join(process.cwd(), ".env.local");

    try {
      const envContent = await readFile(envPath, "utf-8");
      const config = {
        server: extractEnvValue(envContent, "DB_SERVER"),
        database: extractEnvValue(envContent, "DB_NAME"),
        username: extractEnvValue(envContent, "DB_USER"),
        password: "********", // Never return actual password
        port: extractEnvValue(envContent, "DB_PORT") || "1433",
      };

      return NextResponse.json({
        success: true,
        data: config,
      });
    } catch {
      // File doesn't exist, return empty config
      return NextResponse.json({
        success: true,
        data: {
          server: "",
          database: "",
          username: "",
          password: "",
          port: "1433",
        },
      });
    }
  } catch (error) {
    console.error("Error reading database config:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri učitavanju konfiguracije" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { server, database, username, password, port } = body;

    if (!server || !database || !username || !password) {
      return NextResponse.json(
        { success: false, message: "Sva polja su obavezna" },
        { status: 400 }
      );
    }

    const envPath = join(process.cwd(), ".env.local");

    // Read existing env file or create new
    let envContent = "";
    try {
      envContent = await readFile(envPath, "utf-8");
    } catch {
      // File doesn't exist, will create new one
    }

    // Update or add DB config
    const dbKeys = ["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_PORT"];
    const dbValues: Record<string, string> = {
      DB_SERVER: server,
      DB_NAME: database,
      DB_USER: username,
      DB_PASSWORD: password,
      DB_PORT: port || "1433",
    };

    let newEnvContent = envContent;

    // Update existing keys or add new ones
    for (const key of dbKeys) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      const newLine = `${key}=${dbValues[key]}`;

      if (regex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(regex, newLine);
      } else {
        newEnvContent += (newEnvContent ? "\n" : "") + newLine;
      }
    }

    // Write updated env file
    await writeFile(envPath, newEnvContent, "utf-8");

    // Try to restart the service automatically
    let restartMessage = "";
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      // Try systemd first
      try {
        await execAsync("sudo systemctl restart lafantana-admin");
        restartMessage = " Servis je automatski restartovan.";
      } catch {
        // Try PM2
        try {
          await execAsync("pm2 restart lafantana-whs-admin");
          restartMessage = " Servis je automatski restartovan.";
        } catch {
          restartMessage = " Molimo restartujte aplikaciju ručno da bi promene stupile na snagu.";
        }
      }
    } catch {
      restartMessage = " Molimo restartujte aplikaciju ručno da bi promene stupile na snagu.";
    }

    return NextResponse.json({
      success: true,
      message: "Konfiguracija uspešno sačuvana." + restartMessage,
    });
  } catch (error) {
    console.error("Error saving database config:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri snimanju konfiguracije" },
      { status: 500 }
    );
  }
}

function extractEnvValue(content: string, key: string): string {
  const regex = new RegExp(`^${key}=(.*)$`, "m");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

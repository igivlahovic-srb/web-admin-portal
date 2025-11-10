import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log("Starting application update...");

    // Get the root workspace directory (parent of web-admin)
    const rootDir = path.resolve(process.cwd(), "..");
    console.log("Root directory:", rootDir);

    // Pull latest changes from git
    console.log("Pulling latest changes from git...");
    await execAsync("git pull origin main", { cwd: rootDir });

    // Install dependencies in web-admin
    console.log("Installing dependencies for web-admin...");
    await execAsync("bun install", { cwd: process.cwd() });

    // Build the web-admin application
    console.log("Building web-admin application...");
    await execAsync("bun run build", { cwd: process.cwd() });

    // Note: The application restart needs to be handled by PM2 or systemd
    // We'll create a flag file that the process manager can monitor
    const fs = require("fs");
    fs.writeFileSync("/tmp/web-admin-restart-required", "1");

    console.log("Update completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Ažuriranje uspešno! Aplikacija će se restartovati za nekoliko sekundi...",
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri ažuriranju aplikacije: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

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

    // Add vibecode remote if it doesn't exist
    console.log("Configuring git remote...");
    try {
      await execAsync(
        'git remote add vibecode https://019a6624-8c70-7588-b2d9-2c35197b6d10:notrequired@git.vibecodeapp.com/019a6624-8c70-7588-b2d9-2c35197b6d10.git',
        { cwd: rootDir }
      );
    } catch {
      // Remote already exists, that's fine
    }

    // Pull latest changes from Vibecode git
    console.log("Pulling latest changes from Vibecode git...");

    // Stash any local changes (like .env.local) before pulling
    try {
      await execAsync("git stash", { cwd: rootDir });
      console.log("Stashed local changes");
    } catch {
      // No changes to stash, that's fine
    }

    // Pull from vibecode
    await execAsync("git pull vibecode main", { cwd: rootDir });

    // Restore stashed changes
    try {
      await execAsync("git stash pop", { cwd: rootDir });
      console.log("Restored local changes");
    } catch {
      // No stash to pop, that's fine
    }

    // Install dependencies in web-admin
    console.log("Installing dependencies for web-admin...");
    await execAsync("bun install", { cwd: process.cwd() });

    // Build the web-admin application
    console.log("Building web-admin application...");
    await execAsync("bun run build", { cwd: process.cwd() });

    // Restart the service
    console.log("Restarting service...");
    try {
      // Try PM2 first
      await execAsync("pm2 restart lafantana-whs-admin");
      console.log("Service restarted with PM2");
    } catch {
      // Try systemd
      try {
        await execAsync("sudo systemctl restart lafantana-admin");
        console.log("Service restarted with systemd");
      } catch (sysError) {
        console.warn("Could not restart service automatically:", sysError);
        // Create flag file as fallback
        const fs = require("fs");
        fs.writeFileSync("/tmp/web-admin-restart-required", "1");
      }
    }

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

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
    } catch (err) {
      // Remote already exists, that's fine
      console.log("Git remote already exists or error adding:", (err as Error).message);
    }

    // Pull latest changes from Vibecode git
    console.log("Pulling latest changes from Vibecode git...");

    // Backup .env.local before pulling
    const envLocalPath = path.join(rootDir, "web-admin", ".env.local");
    let envBackup = "";
    try {
      const fs = require("fs");
      if (fs.existsSync(envLocalPath)) {
        envBackup = fs.readFileSync(envLocalPath, "utf-8");
        console.log("Backed up .env.local");
      }
    } catch (err) {
      console.warn("Could not backup .env.local:", err);
    }

    // Reset any local changes to tracked files
    try {
      await execAsync("git reset --hard", { cwd: rootDir });
      console.log("Reset local changes");
    } catch (err) {
      // If reset fails, continue anyway
      console.log("Reset failed or not needed:", (err as Error).message);
    }

    // Pull from vibecode
    try {
      const pullResult = await execAsync("git pull vibecode main", { cwd: rootDir });
      console.log("Git pull result:", pullResult.stdout);
    } catch (err) {
      console.error("Git pull error:", (err as Error).message);
      // Continue anyway - might already be up to date
    }

    // Restore .env.local backup
    if (envBackup) {
      try {
        const fs = require("fs");
        fs.writeFileSync(envLocalPath, envBackup, "utf-8");
        console.log("Restored .env.local from backup");
      } catch (err) {
        console.warn("Could not restore .env.local:", err);
      }
    }

    // Install dependencies in web-admin
    console.log("Installing dependencies for web-admin...");
    try {
      // Try bun first, fallback to npm
      let installResult;
      try {
        installResult = await execAsync("/usr/local/bin/bun install", {
          cwd: process.cwd(),
          env: { ...process.env, PATH: "/usr/local/bin:/usr/bin:/bin" }
        });
        console.log("Install result (bun):", installResult.stdout);
      } catch (bunError) {
        console.log("Bun not found, trying npm...");
        // IMPORTANT: Use --include=dev to ensure devDependencies (like tailwindcss) are installed
        // Even on production server, we need build-time dependencies
        installResult = await execAsync("npm install --include=dev", {
          cwd: process.cwd(),
        });
        console.log("Install result (npm):", installResult.stdout);
      }
    } catch (err) {
      console.error("Install error:", (err as any).stderr || (err as Error).message);
      throw new Error("Instalacija dependencies nije uspela: " + (err as Error).message);
    }

    // Clean .next cache before building
    console.log("Cleaning .next cache...");
    try {
      const fs = require("fs");
      const nextCachePath = path.join(process.cwd(), ".next");
      if (fs.existsSync(nextCachePath)) {
        await execAsync("rm -rf .next", { cwd: process.cwd() });
        console.log("Cleaned .next cache");
      }
    } catch (err) {
      console.warn("Could not clean .next cache:", err);
    }

    // Build the web-admin application
    console.log("Building web-admin application...");
    try {
      // Try bun first, fallback to npm
      let buildResult;
      try {
        buildResult = await execAsync("/usr/local/bin/bun run build", {
          cwd: process.cwd(),
          env: { ...process.env, PATH: "/usr/local/bin:/usr/bin:/bin" }
        });
        console.log("Build completed successfully (bun)");
      } catch (bunError) {
        console.log("Bun not found, trying npm...");
        buildResult = await execAsync("npm run build", {
          cwd: process.cwd(),
        });
        console.log("Build completed successfully (npm)");
      }
    } catch (err) {
      console.error("Build error:", (err as any).stderr || (err as Error).message);
      throw new Error("Build nije uspeo: " + (err as Error).message);
    }

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

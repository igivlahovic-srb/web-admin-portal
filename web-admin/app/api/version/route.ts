import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get current version from package.json
    const packageJson = require("../../../../package.json");
    const currentVersion = packageJson.version;

    // Get the root workspace directory (parent of web-admin)
    const rootDir = path.resolve(process.cwd(), "..");

    // Check if there are updates available from git
    let hasUpdate = false;
    let latestCommit = "";
    let currentCommit = "";

    try {
      // Get current commit hash
      const { stdout: currentHash } = await execAsync("git rev-parse HEAD", { cwd: rootDir });
      currentCommit = currentHash.trim().substring(0, 7);

      // Fetch latest from remote without pulling
      await execAsync("git fetch origin main --quiet", { cwd: rootDir });

      // Get latest remote commit hash
      const { stdout: remoteHash } = await execAsync("git rev-parse origin/main", { cwd: rootDir });
      latestCommit = remoteHash.trim().substring(0, 7);

      // Check if they differ
      hasUpdate = currentCommit !== latestCommit;
    } catch (error) {
      console.error("Error checking git updates:", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        currentVersion,
        currentCommit,
        latestCommit,
        hasUpdate,
      },
    });
  } catch (error) {
    console.error("Error getting version:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri proveri verzije" },
      { status: 500 }
    );
  }
}

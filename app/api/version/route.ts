import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get current version from package.json
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const currentVersion = packageJson.version;

    // Check if there are updates available from git
    let hasUpdate = false;
    let latestCommit = "";
    let currentCommit = "";

    try {
      // Get current commit hash
      const { stdout: currentHash } = await execAsync("git rev-parse HEAD");
      currentCommit = currentHash.trim().substring(0, 7);

      // Fetch latest from remote without pulling
      await execAsync("git fetch origin main --quiet");

      // Get latest remote commit hash
      const { stdout: remoteHash } = await execAsync("git rev-parse origin/main");
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

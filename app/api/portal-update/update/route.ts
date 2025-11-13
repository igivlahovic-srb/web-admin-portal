import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Pull latest changes
    const { stdout: pullOutput } = await execAsync("git pull origin main");

    // Install dependencies if package.json changed
    if (pullOutput.includes("package.json")) {
      await execAsync("npm install");
    }

    // Get new commit info
    const { stdout: commitHash } = await execAsync("git rev-parse HEAD");
    const { stdout: commitMsg } = await execAsync("git log -1 --format=%s");
    const { stdout: commitDate } = await execAsync("git log -1 --format=%ci");

    return NextResponse.json({
      success: true,
      message: "Portal uspešno ažuriran! Restartujte server da bi promene stupile na snagu.",
      data: {
        commit: commitHash.trim().substring(0, 7),
        message: commitMsg.trim(),
        date: commitDate.trim(),
        pullOutput: pullOutput.trim(),
      },
    });
  } catch (error) {
    console.error("Error updating portal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri ažuriranju portala",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

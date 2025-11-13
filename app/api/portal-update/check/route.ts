import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get current commit hash
    const { stdout: currentCommit } = await execAsync("git rev-parse HEAD");
    const currentHash = currentCommit.trim();

    // Fetch latest from origin
    await execAsync("git fetch origin main");

    // Get remote commit hash
    const { stdout: remoteCommit } = await execAsync("git rev-parse origin/main");
    const remoteHash = remoteCommit.trim();

    // Get current commit message
    const { stdout: commitMsg } = await execAsync("git log -1 --format=%s");

    // Get last commit date
    const { stdout: commitDate } = await execAsync("git log -1 --format=%ci");

    // Check if update is available
    const updateAvailable = currentHash !== remoteHash;

    // If update available, get the commit message from remote
    let newCommitMsg = "";
    let newCommitDate = "";
    if (updateAvailable) {
      const { stdout: newMsg } = await execAsync("git log origin/main -1 --format=%s");
      newCommitMsg = newMsg.trim();

      const { stdout: newDate } = await execAsync("git log origin/main -1 --format=%ci");
      newCommitDate = newDate.trim();
    }

    return NextResponse.json({
      success: true,
      data: {
        updateAvailable,
        currentCommit: currentHash.substring(0, 7),
        remoteCommit: remoteHash.substring(0, 7),
        currentMessage: commitMsg.trim(),
        currentDate: commitDate.trim(),
        newMessage: newCommitMsg,
        newDate: newCommitDate,
      },
    });
  } catch (error) {
    console.error("Error checking for updates:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri proveri ažuriranja",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

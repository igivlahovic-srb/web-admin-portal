import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Check if Windows
    const isWindows = process.platform === "win32";

    // Get current commit hash
    const { stdout: currentCommit } = await execAsync("git rev-parse HEAD");
    const currentHash = currentCommit.trim();

    // Fetch latest from origin
    try {
      await execAsync("git fetch origin main");
    } catch (fetchError) {
      console.error("Git fetch error:", fetchError);
      // Continue even if fetch fails (might be offline)
    }

    // Get remote commit hash
    let remoteHash = currentHash;
    try {
      const { stdout: remoteCommit } = await execAsync("git rev-parse origin/main");
      remoteHash = remoteCommit.trim();
    } catch (remoteError) {
      console.error("Git remote error:", remoteError);
    }

    // Get current commit message - use simpler command
    let commitMsg = "N/A";
    let commitDate = "N/A";

    try {
      const { stdout: msg } = await execAsync("git log -1 --oneline");
      const parts = msg.trim().split(" ");
      commitMsg = parts.slice(1).join(" ");
    } catch (msgError) {
      console.error("Git log error:", msgError);
    }

    try {
      const { stdout: date } = await execAsync("git log -1 --format=%ci");
      commitDate = date.trim();
    } catch (dateError) {
      console.error("Git date error:", dateError);
    }

    // Check if update is available
    const updateAvailable = currentHash !== remoteHash;

    // If update available, get the commit message from remote
    let newCommitMsg = "";
    let newCommitDate = "";
    if (updateAvailable) {
      try {
        const { stdout: newMsg } = await execAsync("git log origin/main -1 --oneline");
        const parts = newMsg.trim().split(" ");
        newCommitMsg = parts.slice(1).join(" ");
      } catch (newMsgError) {
        console.error("Git new message error:", newMsgError);
      }

      try {
        const { stdout: newDate } = await execAsync("git log origin/main -1 --format=%ci");
        newCommitDate = newDate.trim();
      } catch (newDateError) {
        console.error("Git new date error:", newDateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updateAvailable,
        currentCommit: currentHash.substring(0, 7),
        remoteCommit: remoteHash.substring(0, 7),
        currentMessage: commitMsg,
        currentDate: commitDate,
        newMessage: newCommitMsg,
        newDate: newCommitDate,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error("Error checking for updates:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri proveri ažuriranja",
        error: error instanceof Error ? error.message : "Unknown error",
        platform: process.platform,
      },
      { status: 500 }
    );
  }
}

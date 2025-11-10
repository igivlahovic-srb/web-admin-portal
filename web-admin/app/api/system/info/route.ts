import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get OS version
    let osVersion = "Ubuntu";
    try {
      const { stdout } = await execAsync("cat /etc/os-release | grep PRETTY_NAME | cut -d '\"' -f 2");
      osVersion = stdout.trim();
    } catch {
      try {
        const { stdout } = await execAsync("cat /etc/issue | head -1");
        osVersion = stdout.trim();
      } catch {}
    }

    // Get kernel version
    const { stdout: kernelVersion } = await execAsync("uname -r");

    // Get disk space
    const { stdout: diskSpaceRaw } = await execAsync(
      "df -h / | tail -1 | awk '{print $3, $2, $5}'"
    );
    const [used, total, percentageStr] = diskSpaceRaw.trim().split(" ");
    const percentage = parseInt(percentageStr.replace("%", ""));

    // Get RAM information
    const { stdout: ramInfoRaw } = await execAsync(
      "free -h | grep Mem | awk '{print $2, $3, $7}'"
    );
    const [ramTotal, ramUsed, ramAvailable] = ramInfoRaw.trim().split(" ");

    // Calculate RAM percentage
    const { stdout: ramPercentageRaw } = await execAsync(
      "free | grep Mem | awk '{print ($3/$2) * 100.0}'"
    );
    const ramPercentage = Math.round(parseFloat(ramPercentageRaw.trim()));

    // Check for updates
    let updateAvailable = false;
    try {
      const { stdout: updateCheck } = await execAsync(
        "apt list --upgradable 2>/dev/null | grep -v 'Listing' | wc -l"
      );
      updateAvailable = parseInt(updateCheck.trim()) > 0;
    } catch {
      updateAvailable = false;
    }

    // Get Git information
    const gitDir = "/home/user/workspace/web-admin";

    let gitVersion = "Unknown";
    try {
      const { stdout } = await execAsync(`git -C ${gitDir} rev-parse --short HEAD`);
      gitVersion = stdout.trim();
    } catch {}

    let gitBranch = "main";
    try {
      const { stdout } = await execAsync(`git -C ${gitDir} rev-parse --abbrev-ref HEAD`);
      gitBranch = stdout.trim();
    } catch {}

    let lastCommitDate = "Unknown";
    try {
      const { stdout } = await execAsync(
        `git -C ${gitDir} log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S'`
      );
      lastCommitDate = stdout.trim();
    } catch {}

    let lastCommitMessage = "Unknown";
    try {
      const { stdout } = await execAsync(`git -C ${gitDir} log -1 --format=%s`);
      lastCommitMessage = stdout.trim();
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        osVersion: osVersion.replace(/"/g, ""),
        kernelVersion: kernelVersion.trim(),
        diskSpace: {
          used,
          total,
          percentage,
        },
        ramMemory: {
          total: ramTotal,
          used: ramUsed,
          available: ramAvailable,
          percentage: ramPercentage,
        },
        updateAvailable,
        gitVersion,
        gitBranch,
        lastCommitDate,
        lastCommitMessage,
      },
    });
  } catch (error: any) {
    console.error("Error getting system info:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri učitavanju informacija o sistemu",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Update package lists
    await execAsync("sudo apt update");

    // Upgrade packages (non-interactive)
    await execAsync("sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y");

    // Clean up
    await execAsync("sudo apt autoremove -y && sudo apt autoclean");

    return NextResponse.json({
      success: true,
      message: "Sistem je uspešno ažuriran",
    });
  } catch (error: any) {
    console.error("Error updating system:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri ažuriranju sistema",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

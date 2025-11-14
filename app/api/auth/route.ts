import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../lib/dataStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = dataStore.authenticateUser(username, password);

    if (user) {
      return NextResponse.json({
        success: true,
        data: { user },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid credentials or insufficient permissions" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error authenticating:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}

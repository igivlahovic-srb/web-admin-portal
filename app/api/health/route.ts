import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Web Admin Panel API is running",
    timestamp: new Date().toISOString(),
  });
}

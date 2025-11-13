import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Web Admin Portal API is running',
    timestamp: new Date().toISOString()
  });
}

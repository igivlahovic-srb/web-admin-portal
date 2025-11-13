import { NextResponse } from 'next/server';
import { readJSON } from '../lib/storage';

// GET - Fetch all spare parts
export async function GET() {
  try {
    const data = await readJSON('spare-parts.json');

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Failed to read spare parts data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      spareParts: data.spareParts || []
    });
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

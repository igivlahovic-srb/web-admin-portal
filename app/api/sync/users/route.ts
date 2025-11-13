import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../lib/storage';

// GET - Fetch all users
export async function GET() {
  try {
    const data = await readJSON('users.json');

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Failed to read users data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: data.users || []
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Sync users from mobile app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { success: false, message: 'Invalid users data' },
        { status: 400 }
      );
    }

    // Read existing data
    const existingData = await readJSON('users.json') || { users: [] };

    // Merge users - use incoming data as source of truth but keep existing if not provided
    const userMap = new Map();

    // Add existing users first
    existingData.users?.forEach((user: any) => {
      userMap.set(user.id, user);
    });

    // Override/add with incoming users
    users.forEach((user: any) => {
      userMap.set(user.id, {
        ...userMap.get(user.id),
        ...user,
        syncedAt: new Date().toISOString()
      });
    });

    const mergedUsers = Array.from(userMap.values());

    // Write back to file
    const success = await writeJSON('users.json', { users: mergedUsers });

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to write users data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${users.length} users`,
      syncedCount: users.length,
      totalUsers: mergedUsers.length
    });
  } catch (error) {
    console.error('Error syncing users:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

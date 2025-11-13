import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../lib/storage';

// POST - Close workday for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, closedAt } = body;

    if (!userId || !closedAt) {
      return NextResponse.json(
        { success: false, message: 'Missing userId or closedAt' },
        { status: 400 }
      );
    }

    // Read users data
    const usersData = await readJSON('users.json');

    if (!usersData || !usersData.users) {
      return NextResponse.json(
        { success: false, message: 'Failed to read users data' },
        { status: 500 }
      );
    }

    // Find and update user
    const userIndex = usersData.users.findIndex((u: any) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user workday status
    usersData.users[userIndex] = {
      ...usersData.users[userIndex],
      workdayStatus: 'closed',
      workdayClosedAt: closedAt,
      workdayUpdatedAt: new Date().toISOString()
    };

    // Write back to file
    const success = await writeJSON('users.json', usersData);

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workday closed successfully',
      user: usersData.users[userIndex]
    });
  } catch (error) {
    console.error('Error closing workday:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

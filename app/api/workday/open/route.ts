import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../lib/storage';

// GET - Get workday log
export async function GET() {
  try {
    const data = await readJSON('workday-log.json');

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Failed to read workday log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: data.logs || []
    });
  } catch (error) {
    console.error('Error fetching workday log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Open workday for a user (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason, adminId } = body;

    if (!userId || !reason || !adminId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Reason must be at least 10 characters' },
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

    // Verify admin has permission
    const admin = usersData.users.find((u: any) => u.id === adminId);
    if (!admin || (admin.role !== 'super_user' && admin.role !== 'gospodar')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - admin role required' },
        { status: 403 }
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

    const user = usersData.users[userIndex];

    // Update user workday status
    usersData.users[userIndex] = {
      ...user,
      workdayStatus: 'open',
      workdayOpenedAt: new Date().toISOString(),
      workdayUpdatedAt: new Date().toISOString()
    };

    // Write back users file
    const usersSuccess = await writeJSON('users.json', usersData);

    if (!usersSuccess) {
      return NextResponse.json(
        { success: false, message: 'Failed to update user data' },
        { status: 500 }
      );
    }

    // Add log entry
    const logData = await readJSON('workday-log.json') || { logs: [] };

    const logEntry = {
      id: Date.now().toString(),
      userId,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      adminId,
      adminName: `${admin.firstName} ${admin.lastName}`.trim(),
      reason,
      timestamp: new Date().toISOString()
    };

    logData.logs.push(logEntry);

    // Write back log file
    const logSuccess = await writeJSON('workday-log.json', logData);

    if (!logSuccess) {
      return NextResponse.json(
        { success: false, message: 'Failed to update log data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workday opened successfully',
      user: usersData.users[userIndex],
      logEntry
    });
  } catch (error) {
    console.error('Error opening workday:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

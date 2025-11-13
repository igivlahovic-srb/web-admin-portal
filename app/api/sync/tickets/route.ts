import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../lib/storage';

// GET - Fetch all tickets
export async function GET() {
  try {
    const data = await readJSON('tickets.json');

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Failed to read tickets data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tickets: data.tickets || []
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Sync tickets from mobile app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickets } = body;

    if (!tickets || !Array.isArray(tickets)) {
      return NextResponse.json(
        { success: false, message: 'Invalid tickets data' },
        { status: 400 }
      );
    }

    // Read existing data
    const existingData = await readJSON('tickets.json') || { tickets: [] };

    // Merge tickets - use most recent version based on updatedAt timestamp
    const ticketMap = new Map();

    // Add existing tickets first
    existingData.tickets?.forEach((ticket: any) => {
      ticketMap.set(ticket.id, ticket);
    });

    // Override/add with incoming tickets (prefer most recent)
    tickets.forEach((ticket: any) => {
      const existing = ticketMap.get(ticket.id);

      if (!existing) {
        // New ticket
        ticketMap.set(ticket.id, {
          ...ticket,
          syncedAt: new Date().toISOString()
        });
      } else {
        // Compare timestamps and keep the most recent
        const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime();
        const incomingTime = new Date(ticket.updatedAt || ticket.createdAt).getTime();

        if (incomingTime >= existingTime) {
          ticketMap.set(ticket.id, {
            ...ticket,
            syncedAt: new Date().toISOString()
          });
        }
      }
    });

    const mergedTickets = Array.from(ticketMap.values());

    // Write back to file
    const success = await writeJSON('tickets.json', { tickets: mergedTickets });

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to write tickets data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${tickets.length} tickets`,
      syncedCount: tickets.length,
      totalTickets: mergedTickets.length
    });
  } catch (error) {
    console.error('Error syncing tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

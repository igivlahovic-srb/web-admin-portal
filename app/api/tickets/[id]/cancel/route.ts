import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ServiceTicket } from "../../../../../types";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const ticketId = params.id;
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: "Razlog poništavanja je obavezan" },
        { status: 400 }
      );
    }

    const ticketsPath = join(process.cwd(), "data", "tickets.json");

    // Read current tickets
    const ticketsData = JSON.parse(readFileSync(ticketsPath, "utf-8"));
    const tickets: ServiceTicket[] = Array.isArray(ticketsData)
      ? ticketsData
      : ticketsData.tickets || [];

    // Find the ticket
    const ticketIndex = tickets.findIndex((t) => t.id === ticketId);

    if (ticketIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Servis nije pronađen" },
        { status: 404 }
      );
    }

    const ticket = tickets[ticketIndex];

    // Check if ticket is in progress
    if (ticket.status !== "in_progress") {
      return NextResponse.json(
        {
          success: false,
          message: "Samo servisi u toku mogu biti poništeni"
        },
        { status: 400 }
      );
    }

    // Update ticket status to cancelled
    tickets[ticketIndex] = {
      ...ticket,
      status: "cancelled",
      endTime: new Date().toISOString(),
      durationMinutes: Math.round(
        (new Date().getTime() - new Date(ticket.startTime).getTime()) / 60000
      ),
      cancellationReason: reason.trim(),
    };

    // Write back to file
    writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));

    return NextResponse.json({
      success: true,
      message: "Servis je uspešno poništen",
      ticket: tickets[ticketIndex],
    });
  } catch (error) {
    console.error("Error cancelling ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri poništavanju servisa"
      },
      { status: 500 }
    );
  }
}

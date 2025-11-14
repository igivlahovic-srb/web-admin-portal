import { NextResponse } from "next/server";
import dataStore from "../../../../../lib/dataStore";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await context.params;
    const tickets = dataStore.getTickets();

    const ticketIndex = tickets.findIndex((t) => t.id === ticketId);

    if (ticketIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Servis nije pronađen" },
        { status: 404 }
      );
    }

    const ticket = tickets[ticketIndex];

    // Only allow reopening completed tickets
    if (ticket.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Samo završeni servisi mogu biti ponovo otvoreni" },
        { status: 400 }
      );
    }

    // Reopen the ticket
    const updatedTicket = {
      ...ticket,
      status: "in_progress" as const,
      endTime: undefined,
      durationMinutes: undefined,
    };

    tickets[ticketIndex] = updatedTicket;
    dataStore.setTickets(tickets);

    return NextResponse.json({
      success: true,
      message: "Servis je uspešno ponovo otvoren",
      data: { ticket: updatedTicket },
    });
  } catch (error: any) {
    console.error("Error reopening ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Greška pri ponovnom otvaranju servisa",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

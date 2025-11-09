import { NextResponse } from "next/server";
import { dataStore } from "../../../../../lib/dataStore";

// PUT - Update operation
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const operations = dataStore.getOperations();
    const operation = operations.find((op) => op.id === id);

    if (!operation) {
      return NextResponse.json(
        { success: false, message: "Operacija nije pronađena" },
        { status: 404 }
      );
    }

    dataStore.updateOperation(id, body);

    return NextResponse.json({
      success: true,
      message: "Operacija uspešno ažurirana",
    });
  } catch (error) {
    console.error("Error updating operation:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri ažuriranju operacije" },
      { status: 500 }
    );
  }
}

// DELETE - Delete operation
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const operations = dataStore.getOperations();
    const operation = operations.find((op) => op.id === id);

    if (!operation) {
      return NextResponse.json(
        { success: false, message: "Operacija nije pronađena" },
        { status: 404 }
      );
    }

    dataStore.deleteOperation(id);

    return NextResponse.json({
      success: true,
      message: "Operacija uspešno obrisana",
    });
  } catch (error) {
    console.error("Error deleting operation:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri brisanju operacije" },
      { status: 500 }
    );
  }
}

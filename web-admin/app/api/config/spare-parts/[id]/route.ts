import { NextResponse } from "next/server";
import { dataStore } from "../../../../../lib/dataStore";

// PUT - Update spare part
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const spareParts = dataStore.getSpareParts();
    const sparePart = spareParts.find((sp) => sp.id === id);

    if (!sparePart) {
      return NextResponse.json(
        { success: false, message: "Rezervni deo nije pronađen" },
        { status: 404 }
      );
    }

    dataStore.updateSparePart(id, body);

    return NextResponse.json({
      success: true,
      message: "Rezervni deo uspešno ažuriran",
    });
  } catch (error) {
    console.error("Error updating spare part:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri ažuriranju rezervnog dela" },
      { status: 500 }
    );
  }
}

// DELETE - Delete spare part
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const spareParts = dataStore.getSpareParts();
    const sparePart = spareParts.find((sp) => sp.id === id);

    if (!sparePart) {
      return NextResponse.json(
        { success: false, message: "Rezervni deo nije pronađen" },
        { status: 404 }
      );
    }

    dataStore.deleteSparePart(id);

    return NextResponse.json({
      success: true,
      message: "Rezervni deo uspešno obrisan",
    });
  } catch (error) {
    console.error("Error deleting spare part:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri brisanju rezervnog dela" },
      { status: 500 }
    );
  }
}

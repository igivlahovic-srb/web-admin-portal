import { NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";
import { SparePartTemplate } from "../../../../types";

// GET - List all spare parts
export async function GET() {
  try {
    const spareParts = dataStore.getSpareParts();
    return NextResponse.json({
      success: true,
      data: { spareParts },
    });
  } catch (error) {
    console.error("Error fetching spare parts:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching spare parts" },
      { status: 500 }
    );
  }
}

// POST - Add new spare part
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, code, name, unit } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "ChItemCode i ChItemName su obavezni" },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const spareParts = dataStore.getSpareParts();
    const exists = spareParts.find((sp) => sp.code === code);
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Rezervni deo sa ovom šifrom već postoji" },
        { status: 400 }
      );
    }

    // Check for duplicate id
    if (id) {
      const existsById = spareParts.find((sp) => sp.id === id);
      if (existsById) {
        return NextResponse.json(
          { success: false, message: "Rezervni deo sa ovim ID-jem već postoji" },
          { status: 400 }
        );
      }
    }

    const newSparePart: SparePartTemplate = {
      id: id || `SP-${Date.now()}`,
      code,
      name,
      unit: unit || "kom",
      isActive: true,
      createdAt: new Date(),
    };

    dataStore.addSparePart(newSparePart);

    return NextResponse.json({
      success: true,
      data: { sparePart: newSparePart },
      message: "Rezervni deo uspešno dodat",
    });
  } catch (error) {
    console.error("Error adding spare part:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri dodavanju rezervnog dela" },
      { status: 500 }
    );
  }
}

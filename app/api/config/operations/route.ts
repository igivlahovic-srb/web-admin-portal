import { NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";
import { OperationTemplate } from "../../../../types";

// GET - List all operations
export async function GET() {
  try {
    const operations = dataStore.getOperations();
    return NextResponse.json({
      success: true,
      data: { operations },
    });
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching operations" },
      { status: 500 }
    );
  }
}

// POST - Add new operation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "ChItemCode i ChItemName su obavezni" },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const operations = dataStore.getOperations();
    const exists = operations.find((op) => op.code === code);
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Operacija sa ovom šifrom već postoji" },
        { status: 400 }
      );
    }

    // Check for duplicate id
    if (id) {
      const existsById = operations.find((op) => op.id === id);
      if (existsById) {
        return NextResponse.json(
          { success: false, message: "Operacija sa ovim ID-jem već postoji" },
          { status: 400 }
        );
      }
    }

    const newOperation: OperationTemplate = {
      id: id || `OP-${Date.now()}`,
      code,
      name,
      description: description || "",
      isActive: true,
      createdAt: new Date(),
    };

    dataStore.addOperation(newOperation);

    return NextResponse.json({
      success: true,
      data: { operation: newOperation },
      message: "Operacija uspešno dodata",
    });
  } catch (error) {
    console.error("Error adding operation:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri dodavanju operacije" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { dataStore } from "../../../../../lib/dataStore";
import { OperationTemplate } from "../../../../../types";

// POST - Import multiple operations
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "items niz je obavezan" },
        { status: 400 }
      );
    }

    const operations = dataStore.getOperations();
    const existingIds = operations.map((op) => op.id);
    const existingCodes = operations.map((op) => op.code);

    let added = 0;
    let skipped = 0;

    for (const item of items) {
      // Skip if duplicate
      if (
        (item.id && existingIds.includes(item.id)) ||
        existingCodes.includes(item.code)
      ) {
        skipped++;
        continue;
      }

      const newOperation: OperationTemplate = {
        id: item.id || `OP-${Date.now()}-${added}`,
        code: item.code,
        name: item.name,
        description: item.description || "",
        isActive: true,
        createdAt: new Date(),
      };

      dataStore.addOperation(newOperation);
      existingIds.push(newOperation.id);
      existingCodes.push(newOperation.code);
      added++;
    }

    return NextResponse.json({
      success: true,
      data: { added, skipped },
      message: `Import-ovano ${added} operacija, preskočeno ${skipped} duplikata`,
    });
  } catch (error) {
    console.error("Error importing operations:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri import-u operacija" },
      { status: 500 }
    );
  }
}

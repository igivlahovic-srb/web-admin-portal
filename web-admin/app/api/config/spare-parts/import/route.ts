import { NextResponse } from "next/server";
import { dataStore } from "../../../../../lib/dataStore";
import { SparePartTemplate } from "../../../../../types";

// POST - Import multiple spare parts
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

    const spareParts = dataStore.getSpareParts();
    const existingIds = spareParts.map((sp) => sp.id);
    const existingCodes = spareParts.map((sp) => sp.code);

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

      const newSparePart: SparePartTemplate = {
        id: item.id || `SP-${Date.now()}-${added}`,
        code: item.code,
        name: item.name,
        unit: item.unit || "kom",
        isActive: true,
        createdAt: new Date(),
      };

      dataStore.addSparePart(newSparePart);
      existingIds.push(newSparePart.id);
      existingCodes.push(newSparePart.code);
      added++;
    }

    return NextResponse.json({
      success: true,
      data: { added, skipped },
      message: `Import-ovano ${added} rezervnih delova, preskočeno ${skipped} duplikata`,
    });
  } catch (error) {
    console.error("Error importing spare parts:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri import-u rezervnih delova" },
      { status: 500 }
    );
  }
}

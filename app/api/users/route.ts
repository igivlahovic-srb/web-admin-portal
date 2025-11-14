import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../lib/dataStore";
import { User } from "../../../types";

// POST - Create new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { charismaId, username, password, name, role, depot } = body;

    // Validation
    if (!charismaId || !username || !password || !name || !role || !depot) {
      return NextResponse.json(
        { success: false, message: "Sva polja su obavezna" },
        { status: 400 }
      );
    }

    if (role !== "gospodar" && role !== "super_user" && role !== "technician") {
      return NextResponse.json(
        { success: false, message: "Nevalidna uloga korisnika" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsers = dataStore.getUsers();
    if (existingUsers.some((u) => u.username === username)) {
      return NextResponse.json(
        { success: false, message: "Korisničko ime već postoji" },
        { status: 400 }
      );
    }

    // Check if charismaId already exists
    if (existingUsers.some((u) => u.charismaId === charismaId)) {
      return NextResponse.json(
        { success: false, message: "Charisma ID već postoji" },
        { status: 400 }
      );
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      charismaId,
      username,
      password,
      name,
      role,
      depot,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    dataStore.addUser(newUser);

    return NextResponse.json({
      success: true,
      message: "Korisnik uspešno kreiran",
      data: { user: newUser },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Greška pri kreiranju korisnika" },
      { status: 500 }
    );
  }
}

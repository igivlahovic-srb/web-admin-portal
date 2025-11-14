import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/dataStore";

// PUT - Edit user (full update)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { charismaId, username, name, role, depot, password } = body;

    const users = dataStore.getUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    // Check if username is already taken by another user
    const existingUser = users.find((u) => u.username === username && u.id !== id);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Korisničko ime je već zauzeto" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      charismaId,
      username,
      name,
      role,
      depot,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = password;
    }

    dataStore.updateUser(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Korisnik uspešno ažuriran",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Greška pri ažuriranju korisnika" },
      { status: 500 }
    );
  }
}

// PATCH - Update user (toggle isActive status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const users = dataStore.getUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    // Toggle isActive status
    dataStore.updateUser(id, { isActive: !user.isActive });

    return NextResponse.json({
      success: true,
      message: user.isActive
        ? "Korisnik uspešno deaktiviran"
        : "Korisnik uspešno aktiviran",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Greška pri ažuriranju korisnika" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const users = dataStore.getUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin (super_user or gospodar)
    const admins = users.filter((u) => u.role === "super_user" || u.role === "gospodar");
    if ((user.role === "super_user" || user.role === "gospodar") && admins.length === 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Ne možete obrisati poslednjeg administratora",
        },
        { status: 400 }
      );
    }

    dataStore.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: "Korisnik uspešno obrisan",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Greška pri brisanju korisnika" },
      { status: 500 }
    );
  }
}

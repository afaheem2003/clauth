import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// POST /api/wardrobes/[id]/items - Add an item to a wardrobe
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: wardrobeId } = params;
  const { clothingItemId, notes } = await req.json();

  try {
    // Check if the wardrobe belongs to the user
    const wardrobe = await prisma.wardrobe.findFirst({
      where: {
        id: wardrobeId,
        creator: {
          email: session.user.email,
        },
      },
    });

    if (!wardrobe) {
      return NextResponse.json(
        { error: "Wardrobe not found or unauthorized" },
        { status: 404 }
      );
    }

    // Add the item to the wardrobe
    const wardrobeItem = await prisma.wardrobeItem.create({
      data: {
        wardrobe: {
          connect: { id: wardrobeId },
        },
        clothingItem: {
          connect: { id: clothingItemId },
        },
        notes,
      },
      include: {
        clothingItem: true,
      },
    });

    return NextResponse.json({ wardrobeItem });
  } catch (err) {
    console.error("Error adding item to wardrobe:", err);
    return NextResponse.json(
      { error: "Failed to add item to wardrobe" },
      { status: 500 }
    );
  }
}

// DELETE /api/wardrobes/[id]/items - Remove an item from a wardrobe
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: wardrobeId } = params;
  const { searchParams } = new URL(req.url);
  const clothingItemId = searchParams.get("clothingItemId");

  if (!clothingItemId) {
    return NextResponse.json(
      { error: "Clothing item ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check if the wardrobe belongs to the user
    const wardrobe = await prisma.wardrobe.findFirst({
      where: {
        id: wardrobeId,
        creator: {
          email: session.user.email,
        },
      },
    });

    if (!wardrobe) {
      return NextResponse.json(
        { error: "Wardrobe not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove the item from the wardrobe
    await prisma.wardrobeItem.delete({
      where: {
        wardrobeId_clothingItemId: {
          wardrobeId,
          clothingItemId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing item from wardrobe:", err);
    return NextResponse.json(
      { error: "Failed to remove item from wardrobe" },
      { status: 500 }
    );
  }
} 
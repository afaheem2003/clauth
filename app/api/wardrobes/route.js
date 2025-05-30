import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// GET /api/wardrobes - Get all wardrobes for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wardrobes = await prisma.wardrobe.findMany({
      where: {
        creator: {
          email: session.user.email,
        },
      },
      include: {
        items: {
          include: {
            clothingItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ wardrobes });
  } catch (err) {
    console.error("Error fetching wardrobes:", err);
    return NextResponse.json(
      { error: "Failed to fetch wardrobes" },
      { status: 500 }
    );
  }
}

// POST /api/wardrobes - Create a new wardrobe
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, style, season, occasion, isPublic } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const wardrobe = await prisma.wardrobe.create({
      data: {
        name,
        description,
        style,
        season,
        occasion,
        isPublic: isPublic ?? false,
        creator: {
          connect: {
            email: session.user.email,
          },
        },
      },
    });

    return NextResponse.json({ wardrobe });
  } catch (err) {
    console.error("Error creating wardrobe:", err);
    return NextResponse.json(
      { error: "Failed to create wardrobe" },
      { status: 500 }
    );
  }
} 
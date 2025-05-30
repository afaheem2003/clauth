import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const wardrobe = await prisma.wardrobe.findFirst({
      where: {
        id,
        OR: [
          {
            creator: {
              email: session.user.email,
            },
          },
          {
            isPublic: true,
          },
        ],
      },
      include: {
        items: {
          include: {
            clothingItem: true,
          },
        },
      },
    });

    if (!wardrobe) {
      return NextResponse.json(
        { error: "Wardrobe not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ wardrobe });
  } catch (err) {
    console.error("Error fetching wardrobe:", err);
    return NextResponse.json(
      { error: "Failed to fetch wardrobe" },
      { status: 500 }
    );
  }
} 
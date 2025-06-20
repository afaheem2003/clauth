import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clothingItems = await prisma.clothingItem.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ clothingItems });
  } catch (error) {
    console.error('Failed to fetch clothing items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clothing items' },
      { status: 500 }
    );
  }
}

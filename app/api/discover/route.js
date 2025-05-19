import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const clothingItems = await prisma.clothingItem.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
      },
      include: {
        creator: true,
        likes: true,
        preorders: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process items for serialization
    const processedItems = clothingItems.map(item => ({
      ...item,
      price: item.price?.toString() ?? null,
      cost: item.cost?.toString() ?? null,
    }));

    return NextResponse.json({ clothingItems: processedItems });
  } catch (err) {
    console.error("Error fetching clothing items:", err);
    return NextResponse.json(
      { error: "Failed to fetch clothing items" },
      { status: 500 }
    );
  }
}

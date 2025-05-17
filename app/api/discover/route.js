import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const plushies = await prisma.plushie.findMany({
      where: {
        isPublished: true,
        isDeleted: false, // ✅ Only fetch plushies not marked as deleted
      },
      include: {
        creator: true,
        likes: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    // Sort by closeness to goal
    const sortedPlushies = plushies.sort((a, b) => {
      const diffA = a.goal - a.pledged;
      const diffB = b.goal - b.pledged;
      return diffA - diffB;
    });

    return NextResponse.json({ plushies: sortedPlushies });
  } catch (err) {
    console.error("Error fetching plushies:", err);
    return NextResponse.json(
      { error: "Failed to fetch plushies" },
      { status: 500 }
    );
  }
}

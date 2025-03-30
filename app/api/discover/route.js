import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    // 1) Fetch published plushies, including creator, likes, and comments (with author)
    const plushies = await prisma.plushie.findMany({
      where: { isPublished: true },
      include: {
        creator: true,
        likes: true,
        comments: {
          include: {
            author: true, // <-- Important so we can display the author's name
          },
        },
      },
    });

    // 2) Sort plushies by closeness to goal: lower (goal - pledged) means closer
    const sortedPlushies = plushies.sort((a, b) => {
      const diffA = a.goal - a.pledged;
      const diffB = b.goal - b.pledged;
      return diffA - diffB;
    });

    // 3) Return the sorted plushies
    return NextResponse.json({ plushies: sortedPlushies });
  } catch (err) {
    console.error("Error fetching plushies:", err);
    return NextResponse.json(
      { error: "Failed to fetch plushies" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// 1) GET => Retrieve likes by clothingItemId
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clothingItemId = searchParams.get("clothingItemId");
  if (!clothingItemId) {
    return NextResponse.json({ error: "Missing clothingItemId" }, { status: 400 });
  }
  try {
    const likes = await prisma.like.findMany({
      where: { clothingItemId },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });
    return NextResponse.json({ likes });
  } catch (err) {
    console.error("Error fetching likes:", err);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

// 2) POST => Toggle like (create if missing, remove if exists)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clothingItemId } = await req.json();
  if (!clothingItemId) {
    return NextResponse.json({ error: "Missing clothingItemId" }, { status: 400 });
  }

  try {
    const userId = session.user.uid;
    // Check if a like already exists
    const existingLike = await prisma.like.findUnique({
      where: { userId_clothingItemId: { userId, clothingItemId } },
    });

    if (existingLike) {
      // If found, remove the like (unlike)
      await prisma.like.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ message: "Unliked" });
    } else {
      // Otherwise, create the like
      await prisma.like.create({
        data: {
          user: { connect: { id: userId } },
          clothingItem: { connect: { id: clothingItemId } },
        },
      });
      return NextResponse.json({ message: "Liked" });
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

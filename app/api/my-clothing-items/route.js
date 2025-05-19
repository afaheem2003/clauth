import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const clothingItems = await prisma.clothingItem.findMany({
      where: {
        creator: {
          email: session.user.email, // or use id if preferred
        },
        isDeleted: false, // ✅ Exclude deleted clothing items
      },
      include: {
        creator: true,
      },
    });
    return NextResponse.json({ clothingItems });
  } catch (err) {
    console.error("Error fetching clothing items:", err);
    return NextResponse.json(
      { error: "Failed to fetch clothing items" },
      { status: 500 }
    );
  }
}

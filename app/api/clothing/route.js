import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function POST(req) {
  // In Next.js 13 app router, simply pass authOptions
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    itemType,
    description,
    color,
    material,
    isPublished,
    price,
    goal,
    minimumGoal,
    status
  } = body;

  if (!name || !itemType) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Use session.user.uid as the user's ID
    const clothingItem = await prisma.clothingItem.create({
      data: {
        name,
        itemType,
        description,
        color,
        material,
        isPublished: !!isPublished,
        isDeleted: false, // ✅ ensure it's explicitly set
        price: price || 0,
        goal: goal || 100,
        minimumGoal: minimumGoal || 25,
        status: status || 'PENDING',
        pledged: 0,
        creator: {
          connect: {
            id: session.user.uid,
          },
        },
      },
    });

    console.log("✅ Clothing item created:", clothingItem.id);
    return NextResponse.json({ clothingItem });
  } catch (err) {
    console.error("❌ Failed to create clothing item:", err);
    return NextResponse.json(
      { error: "Failed to create clothing item" },
      { status: 500 }
    );
  }
}

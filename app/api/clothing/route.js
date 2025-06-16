import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { Filter } from "bad-words";
import { ANGLES } from "@/utils/imageProcessing";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
  }

  const {
    name,
    description = "",
    itemType,
    imageUrls,
    promptRaw,
    promptSanitized = "",
    color = "",
    quality = "medium",
    isPublished = false,
    price = 0,
    status = "CONCEPT"
  } = body;

  if (!name || !itemType || !imageUrls || !promptRaw) {
    return NextResponse.json({ error: "Missing required fields (name, itemType, imageUrls, or promptRaw)." }, { status: 400 });
  }

  if (!imageUrls[ANGLES.FRONT]) {
    return NextResponse.json({ error: "Missing front image URL." }, { status: 400 });
  }

  const filter = new Filter();
  const fieldsToCheck = [name, description, itemType, color];
  if (fieldsToCheck.some((field) => field && filter.isProfane(field))) {
    return NextResponse.json({ error: "Inappropriate language detected" }, { status: 400 });
  }

  try {
    const clothingItem = await prisma.clothingItem.create({
      data: {
        name,
        description,
        itemType,
        imageUrl: imageUrls[ANGLES.FRONT],
        frontImage: imageUrls[ANGLES.FRONT],
        backImage: imageUrls[ANGLES.BACK],
        promptRaw,
        promptSanitized,
        color,
        quality,
        isPublished: Boolean(isPublished),
        price: Number(price),
        status,
        creator: {
          connect: { id: session.user.uid },
        },
      },
    });

    return NextResponse.json({ clothingItem });
  } catch (err) {
    console.error("❌ Failed to save clothing item:", err);
    return NextResponse.json({ error: "Failed to save clothing item" }, { status: 500 });
  }
}

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
    imageUrl,
    promptRaw,
    promptSanitized,
    texture,
    size,
    emotion,
    color,
    outfit,
    accessories,
    pose,
    isPublished,
  } = body;

  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Use session.user.uid as the user's ID
    const plushie = await prisma.plushie.create({
      data: {
        name,
        imageUrl,
        promptRaw,
        promptSanitized: promptSanitized || "",
        texture,
        size,
        emotion: emotion || "",
        color,
        outfit,
        accessories,
        pose,
        isPublished: !!isPublished,
        creator: {
          connect: {
            id: session.user.uid, // the new key
          },
        },
      },
    });

    console.log("✅ Plushie published:", plushie.id);
    return NextResponse.json({ plushie });
  } catch (err) {
    console.error("❌ Failed to publish plushie:", err);
    return NextResponse.json(
      { error: "Failed to create plushie" },
      { status: 500 }
    );
  }
}

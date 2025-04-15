import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/app/lib/prisma";

export async function POST(req) {
  console.log("📥 Hit /api/saved-plushies POST");

  // Use getServerSession with authOptions
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.warn("⚠️ Unauthorized request – no session user");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("🧸 Received body:", body);

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
  } = body;

  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    console.warn("⚠️ Missing required fields in body");
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const userId = session.user.uid;
  console.log("🙋 user ID:", userId);

  if (!userId) {
    console.error("❌ session.user.uid is undefined");
    return NextResponse.json({ error: "Missing user UID" }, { status: 500 });
  }

  try {
    const draft = await prisma.savedPlushie.create({
      data: {
        // These fields must exist in your Prisma schema if you want to store them here.
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
        // Connect the user by ID
        user: {
          connect: { id: userId },
        },
      },
    });

    console.log("✅ Draft saved:", draft.id);
    return NextResponse.json({ savedPlushie: draft });
  } catch (err) {
    console.error("❌ Failed to save draft:", err);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

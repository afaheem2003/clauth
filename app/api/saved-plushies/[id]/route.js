// app/api/saved‑plushies/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/app/api/auth/[...nextauth]/route";
import prisma               from "@/app/lib/prisma";

export async function PUT(request, { params }) {
  // ✨ await params so you can destructure id
  const { id } = await params;

  // 1) grab your session
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) parse & validate incoming body
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
  } = await request.json();

  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // 3) ensure it exists & belongs to this user
  const existing = await prisma.plushie.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.creatorId !== session.user.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 4) perform the update
  try {
    const updated = await prisma.plushie.update({
      where: { id },
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
        isPublished: Boolean(isPublished),
      },
    });
    return NextResponse.json({ plushie: updated });
  } catch (err) {
    console.error("❌ Failed to update plushie:", err);
    return NextResponse.json(
      { error: "Failed to update plushie" },
      { status: 500 }
    );
  }
}

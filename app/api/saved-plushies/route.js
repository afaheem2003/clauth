// app/api/saved‑plushies/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  console.log("🔥 session:", session);
  console.log("🔥 session.user.uid:", session?.user?.uid);

  if (!session?.user?.uid) {
    console.warn("⚠️ No user.uid in session, unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id,                  // optional: if present, we’ll update instead of create
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
    isPublished = false, // default to draft
  } = body;

  // sanity check
  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    console.warn("⚠️ Missing required fields:", { name, imageUrl, promptRaw, texture, size });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    let plushie;
    if (id) {
      plushie = await prisma.plushie.update({
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
    } else {
      plushie = await prisma.plushie.create({
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
          creator: { connect: { id: session.user.uid } },
        },
      });
    }

    console.log("✅ saved Plushie:", plushie.id);
    return NextResponse.json({ plushie });
  } catch (err) {
    console.error("❌ Failed to save Plushie:", err);
    return NextResponse.json({ error: "Failed to save plushie" }, { status: 500 });
  }
}

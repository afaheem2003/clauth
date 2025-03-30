// app/api/saved-plushies/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

export async function POST(req) {
  console.log("📥 Hit /api/saved-plushies POST");

  // Fetch the session
  const session = await getServerSession(authOptions);
  console.log("🔎 Full session object =>", session);
  if (!session?.user) {
    console.warn("⚠️ Unauthorized request – no session user");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("🔎 session.user =>", session.user);

  // Parse the request body
  const body = await req.json();
  console.log("🧸 Received body:", body);

  // Extract fields (plushieId is optional for update)
  const {
    plushieId,
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

  // Validate required fields
  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    console.warn("⚠️ Missing required fields in body");
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Use uid from session as the user's identifier
  const userId = session.user.uid;
  console.log("🙋 User ID:", userId);
  if (!userId) {
    console.error("❌ session.user.uid is undefined");
    return NextResponse.json({ error: "Missing user UID" }, { status: 500 });
  }

  try {
    let plushie;

    if (plushieId) {
      // Update existing Plushie
      console.log("Updating existing Plushie with id:", plushieId);
      plushie = await prisma.plushie.update({
        where: { id: plushieId },
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
        },
      });
    } else {
      // Create new Plushie
      console.log("Creating new Plushie record");
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
          isPublished: !!isPublished,
          creator: {
            connect: { id: userId },
          },
        },
      });
    }

    console.log("✅ Plushie record processed with id:", plushie.id);
    return NextResponse.json({ plushie });
  } catch (err) {
    console.error("❌ Failed to process plushie record:", err);
    return NextResponse.json(
      { error: "Failed to process plushie record" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();

  const { firebaseUid, email, displayName, photoUrl } = body;

  if (!firebaseUid) {
    return NextResponse.json({ error: "Missing firebaseUid" }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (existingUser) {
      return NextResponse.json({ user: existingUser }, { status: 200 });
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        displayName,
        photoUrl,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

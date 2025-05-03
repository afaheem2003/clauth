// app/api/my-plushies/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const plushies = await prisma.plushie.findMany({
      where: {
        creator: {
          email: session.user.email, // or use id if you prefer
        },
      },
      include: {
        creator: true,
      },
    });
    return NextResponse.json({ plushies });
  } catch (err) {
    console.error("Error fetching plushies:", err);
    return NextResponse.json(
      { error: "Failed to fetch plushies" },
      { status: 500 }
    );
  }
}

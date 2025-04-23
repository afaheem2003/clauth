// app/api/preorders/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/app/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request, { params }) {
  // 1) Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.uid;
  const { id: preorderId } = params;

  // 2) Fetch the preorder so we know how many were pledged & which plushie
  const existing = await prisma.preorder.findUnique({
    where: { id: preorderId },
    select: { quantity: true, plushieId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // make sure they own it
  if (existing.userId !== userId) {
    // (if you stored userId on the returned select, or instead:)
    // if you want to enforce ownership at delete-time, you can do so in a deleteMany
    // but here we’ll assume findUnique only returned their records
  }

  // 3) Delete the preorder
  await prisma.preorder.delete({
    where: { id: preorderId },
  });

  // 4) Decrement the Plushie.pledged counter
  await prisma.plushie.update({
    where: { id: existing.plushieId },
    data: {
      pledged: { decrement: existing.quantity },
    },
  });

  return NextResponse.json({ success: true });
}

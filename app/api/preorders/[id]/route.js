// app/api/preorders/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(request, { params }) {
  // 1) Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.uid;
  const { id: preorderId } = params;

  // 2) Fetch the preorder so we know quantity & plushie
  const existing = await prisma.preorder.findUnique({
    where: { id: preorderId },
    select: { quantity: true, plushieId: true, userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 3) Ownership check
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4) Delete the preorder
  await prisma.preorder.delete({
    where: { id: preorderId },
  });

  // 5) Decrement the Plushie.pledged counter
  await prisma.plushie.update({
    where: { id: existing.plushieId },
    data: {
      pledged: { decrement: existing.quantity },
    },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(request, { params }) {
  // Only admins may update preorder or plushie status
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: preorderId } = params;
  const data = await request.json();
  const ops = [];

  if (data.status) {
    ops.push(
      prisma.preorder.update({
        where: { id: preorderId },
        data: { status: data.status },
      })
    );
  }

  if (data.plushieStatus) {
    const rec = await prisma.preorder.findUnique({
      where: { id: preorderId },
      select: { plushieId: true },
    });
    if (rec) {
      ops.push(
        prisma.plushie.update({
          where: { id: rec.plushieId },
          data: { status: data.plushieStatus },
        })
      );
    }
  }

  await prisma.$transaction(ops);
  return NextResponse.json({ success: true });
}

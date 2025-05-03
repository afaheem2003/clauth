import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// DELETE /api/preorders/[id]
export async function DELETE(req, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const preorderId = context.params.id; // ✅ CORRECT WAY TO ACCESS params

  try {
    const existing = await prisma.preorder.findUnique({
      where: { id: preorderId },
    });

    if (!existing || existing.userId !== session.user.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await prisma.preorder.delete({ where: { id: preorderId } });

    await prisma.plushie.update({
      where: { id: existing.plushieId },
      data: { pledged: { decrement: existing.quantity } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting preorder:", err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

// GET /api/preorders/[id]
export async function GET(req, context) {
  const plushieId = context.params.id;
  try {
    const plushie = await prisma.plushie.findUnique({ where: { id: plushieId } });
    if (!plushie) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ plushie });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

// PUT /api/preorders/[id]
export async function PUT(req, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plushieId = context.params.id;
  const data = await req.json();

  try {
    const updated = await prisma.plushie.update({ where: { id: plushieId }, data });
    return NextResponse.json({ plushie: updated });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

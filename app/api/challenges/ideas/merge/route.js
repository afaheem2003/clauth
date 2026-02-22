import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// POST /api/challenges/ideas/merge
// Body: { duplicateId, canonicalId }
// Merges duplicateId into canonicalId (votes are summed, duplicate hidden)
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { duplicateId, canonicalId } = await request.json();
  if (!duplicateId || !canonicalId || duplicateId === canonicalId) {
    return NextResponse.json({ error: 'Invalid merge request.' }, { status: 400 });
  }

  const [dup, canon] = await Promise.all([
    prisma.challengeIdea.findUnique({ where: { id: duplicateId } }),
    prisma.challengeIdea.findUnique({ where: { id: canonicalId } }),
  ]);

  if (!dup || !canon) return NextResponse.json({ error: 'Idea not found.' }, { status: 404 });
  if (dup.canonicalId) return NextResponse.json({ error: 'Idea is already merged.' }, { status: 400 });
  if (canon.canonicalId) return NextResponse.json({ error: 'Target is already merged; pick the canonical.' }, { status: 400 });

  // Only the idea's author or an admin can trigger the merge from their side
  const isAdmin = session.user.isAdmin;
  if (!isAdmin && dup.userId !== session.user.uid && canon.userId !== session.user.uid) {
    return NextResponse.json({ error: 'Not authorized to merge these ideas.' }, { status: 403 });
  }

  // Transfer the duplicate's votes (minus the already-counted author vote) into the canonical
  const votesToTransfer = Math.max(0, dup.voteCount - 1);

  await prisma.$transaction([
    // Point duplicate at the canonical
    prisma.challengeIdea.update({
      where: { id: duplicateId },
      data: { canonicalId },
    }),
    // Add transferred votes to canonical
    prisma.challengeIdea.update({
      where: { id: canonicalId },
      data: { voteCount: { increment: votesToTransfer } },
    }),
  ]);

  return NextResponse.json({ merged: true });
}

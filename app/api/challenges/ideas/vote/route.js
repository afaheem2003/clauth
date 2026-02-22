import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// POST /api/challenges/ideas/vote — toggle vote on an idea
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ideaId } = await request.json();
  if (!ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 });

  const idea = await prisma.challengeIdea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.canonicalId) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  // Prevent self-voting
  if (idea.userId === session.user.uid) {
    return NextResponse.json({ error: 'Cannot vote on your own idea.' }, { status: 400 });
  }

  const existing = await prisma.challengeIdeaVote.findUnique({
    where: { ideaId_userId: { ideaId, userId: session.user.uid } },
  });

  if (existing) {
    // Toggle off
    await prisma.$transaction([
      prisma.challengeIdeaVote.delete({ where: { id: existing.id } }),
      prisma.challengeIdea.update({ where: { id: ideaId }, data: { voteCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ voted: false });
  } else {
    // Toggle on
    await prisma.$transaction([
      prisma.challengeIdeaVote.create({ data: { ideaId, userId: session.user.uid } }),
      prisma.challengeIdea.update({ where: { id: ideaId }, data: { voteCount: { increment: 1 } } }),
    ]);
    return NextResponse.json({ voted: true });
  }
}

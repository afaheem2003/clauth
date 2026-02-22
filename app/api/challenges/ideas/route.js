import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const norm_a = a.toLowerCase().trim();
  const norm_b = b.toLowerCase().trim();
  const maxLen = Math.max(norm_a.length, norm_b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(norm_a, norm_b) / maxLen;
}

const SIMILARITY_THRESHOLD = 0.72; // ideas above this are considered "similar"

// GET /api/challenges/ideas — ranked leaderboard of active (non-merged) ideas
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ideas = await prisma.challengeIdea.findMany({
    where: { canonicalId: null }, // only show canonical (non-merged) ideas
    orderBy: { voteCount: 'desc' },
    include: {
      user: { select: { id: true, displayName: true, name: true, image: true } },
      votes: { select: { userId: true } },
      mergedIdeas: { select: { id: true, title: true } },
    },
  });

  // Tag each idea with whether the current user has voted
  const myId = session.user.uid;
  const result = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    voteCount: idea.voteCount,
    hasVoted: idea.votes.some((v) => v.userId === myId),
    isOwn: idea.userId === myId,
    submittedBy: idea.user.displayName || idea.user.name,
    mergedCount: idea.mergedIdeas.length,
    createdAt: idea.createdAt,
  }));

  return NextResponse.json({ ideas: result });
}

// POST /api/challenges/ideas — submit a new idea
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, force } = await request.json();
  if (!title || title.trim().length < 3) {
    return NextResponse.json({ error: 'Title must be at least 3 characters.' }, { status: 400 });
  }
  if (title.trim().length > 100) {
    return NextResponse.json({ error: 'Title too long (max 100 chars).' }, { status: 400 });
  }

  const normalizedTitle = title.trim();

  if (!force) {
    // Find similar existing ideas (only canonical ones)
    const existing = await prisma.challengeIdea.findMany({
      where: { canonicalId: null },
      select: { id: true, title: true, voteCount: true },
    });

    const similar = existing
      .map((e) => ({ ...e, score: similarity(normalizedTitle, e.title) }))
      .filter((e) => e.score >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    if (similar.length > 0) {
      // Return similar ideas so the client can ask the user what to do
      return NextResponse.json({
        similar: similar.slice(0, 3).map((s) => ({ id: s.id, title: s.title, voteCount: s.voteCount })),
      }, { status: 409 });
    }
  }

  // No duplicates — create idea (author's vote is implicit, voteCount starts at 1)
  const idea = await prisma.challengeIdea.create({
    data: {
      userId: session.user.uid,
      title: normalizedTitle,
      description: description?.trim() || null,
      voteCount: 1,
    },
  });

  return NextResponse.json({ idea }, { status: 201 });
}

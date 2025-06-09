import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    // Build where clause for submissions
    let whereClause = {
      isPublic: true,
      isEligibleForGlobal: true, // Only show eligible participants
      generationStatus: 'COMPLETED' // Only completed submissions
    };

    if (challengeId) {
      whereClause.challengeId = challengeId;
    }

    // Get all eligible submissions with upvote counts
    const submissions = await prisma.challengeSubmission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            handle: true
          }
        },
        challenge: {
          select: {
            id: true,
            theme: true,
            mainItem: true,
            date: true
          }
        },
        _count: {
          select: {
            upvotes: true
          }
        }
      },
      orderBy: [
        { submittedAt: 'asc' } // For tie-breaking
      ]
    });

    // If no submissions found, still return empty leaderboard with challenges for filter
    if (submissions.length === 0) {
      const challenges = await prisma.dailyChallenge.findMany({
        select: {
          id: true,
          theme: true,
          mainItem: true,
          date: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      return NextResponse.json({
        success: true,
        leaderboard: [],
        challenges,
        totalEligible: 0,
        showingTop25Percent: 0,
        message: 'No eligible submissions found. Users need to upvote 3+ submissions and have completed designs to appear on the leaderboard.'
      });
    }

    // Sort by upvote count (descending), then by submission time (ascending for tie-breaking)
    const rankedSubmissions = submissions.sort((a, b) => {
      if (b._count.upvotes !== a._count.upvotes) {
        return b._count.upvotes - a._count.upvotes;
      }
      // If tied on upvotes, earlier submission wins
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });

    // Calculate top 25% cutoff (minimum of 1 person)
    const top25PercentCount = Math.max(1, Math.ceil(rankedSubmissions.length * 0.25));
    const topSubmissions = rankedSubmissions.slice(0, top25PercentCount);

    // Add rank to each submission
    const leaderboard = topSubmissions.map((submission, index) => ({
      id: submission.id,
      rank: index + 1,
      outfitDescription: submission.outfitDescription,
      generatedImageUrl: submission.generatedImageUrl,
      submittedAt: submission.submittedAt,
      upvotes: submission._count.upvotes,
      user: submission.user,
      group: submission.group,
      challenge: challengeId ? null : submission.challenge // Don't include challenge info if filtering by specific challenge
    }));

    // Get available challenges for filter dropdown (only challenges with eligible submissions)
    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        submissions: {
          some: {
            isEligibleForGlobal: true,
            isPublic: true,
            generationStatus: 'COMPLETED'
          }
        }
      },
      select: {
        id: true,
        theme: true,
        mainItem: true,
        date: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      leaderboard,
      challenges,
      totalEligible: rankedSubmissions.length,
      showingTop25Percent: top25PercentCount
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 }
    );
  }
} 
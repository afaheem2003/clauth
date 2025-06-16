import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { getUserCompetitionRoom } from '@/services/competitionRoomService';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Get user's competition room for this challenge
    const userRoom = await getUserCompetitionRoom(user.id, challengeId);
    
    if (!userRoom) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        roomInfo: null,
        totalEligible: 0,
        showingTop25Percent: 0,
        message: 'You are not assigned to a competition room for this challenge yet. Submit a design to join!'
      });
    }

    // Build where clause for submissions in the user's room
    const whereClause = {
      competitionRoomId: userRoom.id,
      isPublic: true,
      isEligibleForCompetition: true, // Only show eligible participants
      generationStatus: 'COMPLETED' // Only completed submissions
    };

    // Get all eligible submissions in the user's room with upvote counts
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

    // If no submissions found, still return empty leaderboard
    if (submissions.length === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        roomInfo: {
          id: userRoom.id,
          roomNumber: userRoom.roomNumber,
          participantCount: userRoom._count.participants,
          submissionCount: userRoom._count.submissions
        },
        totalEligible: 0,
        showingTop25Percent: 0,
        message: 'No eligible submissions found in your competition room. Users need to upvote 3+ submissions to be eligible for rankings.'
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
      challenge: submission.challenge
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
      roomInfo: {
        id: userRoom.id,
        roomNumber: userRoom.roomNumber,
        participantCount: userRoom._count.participants,
        submissionCount: userRoom._count.submissions
      },
      totalEligible: rankedSubmissions.length,
      showingTop25Percent: top25PercentCount
    });
  } catch (error) {
    console.error('Error fetching room leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 }
    );
  }
} 
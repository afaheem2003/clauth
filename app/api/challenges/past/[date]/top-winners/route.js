import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { date } = resolvedParams;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Parse the date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Find the challenge for this date
    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: targetDate
      }
    });

    if (!challenge) {
      return NextResponse.json({
        success: true,
        winners: [],
        challenge: null
      });
    }

    // Get top 3 submissions across all rooms for this challenge
    // Only include eligible submissions (users who voted on 3+ others)
    const topWinners = await prisma.challengeSubmission.findMany({
      where: {
        challengeId: challenge.id,
        isEligibleForCompetition: true,
        competitionRoomId: {
          not: null // Must be assigned to a room
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        competitionRoom: {
          select: {
            roomNumber: true
          }
        },
        _count: {
          select: {
            upvotes: true
          }
        }
      },
      orderBy: [
        {
          upvotes: {
            _count: 'desc'
          }
        },
        {
          submittedAt: 'asc' // Secondary sort by submission time for ties
        }
      ],
      take: 3 // Top 3 winners
    });

    // Transform the data to include upvote count and room info
    const winnersWithDetails = topWinners.map((submission, index) => ({
      id: submission.id,
      rank: index + 1,
      outfitDescription: submission.outfitDescription,
      generatedImageUrl: submission.generatedImageUrl,
      submittedAt: submission.submittedAt,
      upvoteCount: submission._count.upvotes,
      roomNumber: submission.competitionRoom?.roomNumber,
      user: submission.user
    }));

    return NextResponse.json({
      success: true,
      winners: winnersWithDetails,
      challenge: {
        id: challenge.id,
        theme: challenge.theme,
        mainItem: challenge.mainItem,
        description: challenge.description,
        date: challenge.date
      }
    });
  } catch (error) {
    console.error('Error fetching top winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top winners' },
      { status: 500 }
    );
  }
} 
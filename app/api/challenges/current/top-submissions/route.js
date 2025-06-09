import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get today's challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: today
      }
    });

    if (!currentChallenge) {
      return NextResponse.json({
        success: true,
        submissions: []
      });
    }

    // Get top submissions for today's challenge, ordered by upvote count
    const topSubmissions = await prisma.challengeSubmission.findMany({
      where: {
        challengeId: currentChallenge.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
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
      take: 12 // Limit to top 12 submissions
    });

    // Transform the data to include upvote count
    const submissionsWithUpvotes = topSubmissions.map(submission => ({
      id: submission.id,
      outfitDescription: submission.outfitDescription,
      generatedImageUrl: submission.generatedImageUrl,
      submittedAt: submission.submittedAt,
      upvoteCount: submission._count.upvotes,
      user: submission.user
    }));

    return NextResponse.json({
      success: true,
      submissions: submissionsWithUpvotes,
      challenge: {
        id: currentChallenge.id,
        theme: currentChallenge.theme,
        mainItem: currentChallenge.mainItem,
        date: currentChallenge.date
      }
    });
  } catch (error) {
    console.error('Error fetching top submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top submissions' },
      { status: 500 }
    );
  }
} 
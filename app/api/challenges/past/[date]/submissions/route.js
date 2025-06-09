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
        submissions: [],
        challenge: null
      });
    }

    // Get top submissions for this challenge, ordered by upvote count
    const topSubmissions = await prisma.challengeSubmission.findMany({
      where: {
        challengeId: challenge.id
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
      take: 20 // Limit to top 20 submissions
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
        id: challenge.id,
        theme: challenge.theme,
        mainItem: challenge.mainItem,
        description: challenge.description,
        date: challenge.date
      }
    });
  } catch (error) {
    console.error('Error fetching submissions for date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 
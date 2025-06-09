import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
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

    const challengeId = params.id;

    // Verify the challenge exists
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return NextResponse.json({ 
        error: 'Challenge not found' 
      }, { status: 404 });
    }

    // Get all public submissions for this challenge
    const submissions = await prisma.challengeSubmission.findMany({
      where: {
        challengeId,
        isPublic: true
      },
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
        _count: {
          select: {
            upvotes: true
          }
        }
      },
      orderBy: [
        { submittedAt: 'desc' }
      ]
    });

    // Get user's upvotes for this challenge
    const userUpvotes = await prisma.submissionUpvote.findMany({
      where: {
        userId: user.id,
        submission: {
          challengeId
        }
      },
      select: {
        submissionId: true
      }
    });

    // Get user's own submission if any
    const userSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId,
        userId: user.id
      },
      select: {
        id: true,
        isEligibleForGlobal: true
      }
    });

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        mainItem: challenge.mainItem,
        theme: challenge.theme,
        description: challenge.description,
        date: challenge.date
      },
      submissions: submissions.map(submission => ({
        id: submission.id,
        outfitDescription: submission.outfitDescription,
        generatedImageUrl: submission.generatedImageUrl,
        submittedAt: submission.submittedAt,
        user: submission.user,
        group: submission.group,
        _count: submission._count
      })),
      userUpvotes: userUpvotes.map(upvote => upvote.submissionId),
      userSubmission
    });
  } catch (error) {
    console.error('Error fetching challenge submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge submissions' },
      { status: 500 }
    );
  }
} 
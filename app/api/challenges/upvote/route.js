import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request) {
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

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ 
        error: 'Submission ID is required' 
      }, { status: 400 });
    }

    // Verify the submission exists and is public
    const submission = await prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: true
      }
    });

    if (!submission) {
      return NextResponse.json({ 
        error: 'Submission not found' 
      }, { status: 404 });
    }

    if (!submission.isPublic) {
      return NextResponse.json({ 
        error: 'Cannot upvote private submissions' 
      }, { status: 400 });
    }

    // Check if user is trying to upvote their own submission
    if (submission.userId === user.id) {
      return NextResponse.json({ 
        error: 'Cannot upvote your own submission' 
      }, { status: 400 });
    }

    // Check if user has already upvoted this submission
    const existingUpvote = await prisma.submissionUpvote.findUnique({
      where: {
        submissionId_userId: {
          submissionId,
          userId: user.id
        }
      }
    });

    if (existingUpvote) {
      return NextResponse.json({ 
        error: 'You have already upvoted this submission' 
      }, { status: 400 });
    }

    // Create the upvote
    await prisma.submissionUpvote.create({
      data: {
        submissionId,
        userId: user.id
      }
    });

    // Check if user now has 3+ upvotes for this challenge
    const userUpvoteCount = await prisma.submissionUpvote.count({
      where: {
        userId: user.id,
        submission: {
          challengeId: submission.challengeId
        }
      }
    });

    // If user has 3+ upvotes, make all their submissions for this challenge eligible for global competition
    if (userUpvoteCount >= 3) {
      await prisma.challengeSubmission.updateMany({
        where: {
          challengeId: submission.challengeId,
          userId: user.id,
          isEligibleForGlobal: false
        },
        data: {
          isEligibleForGlobal: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      upvoteCount: userUpvoteCount,
      isEligibleForGlobal: userUpvoteCount >= 3
    });
  } catch (error) {
    console.error('Error creating upvote:', error);
    return NextResponse.json(
      { error: 'Failed to create upvote' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ 
        error: 'Submission ID is required' 
      }, { status: 400 });
    }

    // Verify the upvote exists
    const existingUpvote = await prisma.submissionUpvote.findUnique({
      where: {
        submissionId_userId: {
          submissionId,
          userId: user.id
        }
      },
      include: {
        submission: {
          include: {
            challenge: true
          }
        }
      }
    });

    if (!existingUpvote) {
      return NextResponse.json({ 
        error: 'Upvote not found' 
      }, { status: 404 });
    }

    // Delete the upvote
    await prisma.submissionUpvote.delete({
      where: {
        submissionId_userId: {
          submissionId,
          userId: user.id
        }
      }
    });

    // Check if user now has less than 3 upvotes for this challenge
    const userUpvoteCount = await prisma.submissionUpvote.count({
      where: {
        userId: user.id,
        submission: {
          challengeId: existingUpvote.submission.challengeId
        }
      }
    });

    // If user has less than 3 upvotes, make all their submissions for this challenge ineligible for global competition
    if (userUpvoteCount < 3) {
      await prisma.challengeSubmission.updateMany({
        where: {
          challengeId: existingUpvote.submission.challengeId,
          userId: user.id,
          isEligibleForGlobal: true
        },
        data: {
          isEligibleForGlobal: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      upvoteCount: userUpvoteCount,
      isEligibleForGlobal: userUpvoteCount >= 3
    });
  } catch (error) {
    console.error('Error deleting upvote:', error);
    return NextResponse.json(
      { error: 'Failed to delete upvote' },
      { status: 500 }
    );
  }
} 
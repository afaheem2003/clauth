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
        competitionRoom: true,
        clothingItem: true
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

    // Create the upvote and potentially like the clothing item in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the upvote
      await tx.submissionUpvote.create({
        data: {
          submissionId,
          userId: user.id
        }
      });

      // If this submission has a clothing item, also like it (if not already liked)
      if (submission.clothingItemId) {
        const existingLike = await tx.clothingItemLike.findUnique({
          where: {
            clothingItemId_userId: {
              clothingItemId: submission.clothingItemId,
              userId: user.id
            }
          }
        });

        if (!existingLike) {
          await tx.clothingItemLike.create({
            data: {
              clothingItemId: submission.clothingItemId,
              userId: user.id
            }
          });
        }
      }
    });

    // Check if user now has 3+ upvotes for this challenge within their competition room
    const userUpvoteCount = await prisma.submissionUpvote.count({
      where: {
        userId: user.id,
        submission: {
          challengeId: submission.challengeId,
          competitionRoomId: submission.competitionRoomId
        }
      }
    });

    // If user has 3+ upvotes in their room, make all their submissions for this challenge eligible for competition
    if (userUpvoteCount >= 3) {
      await prisma.challengeSubmission.updateMany({
        where: {
          challengeId: submission.challengeId,
          userId: user.id,
          isEligibleForCompetition: false
        },
        data: {
          isEligibleForCompetition: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      upvoteCount: userUpvoteCount,
      isEligibleForCompetition: userUpvoteCount >= 3
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
            competitionRoom: true,
            clothingItem: true
          }
        }
      }
    });

    if (!existingUpvote) {
      return NextResponse.json({ 
        error: 'Upvote not found' 
      }, { status: 404 });
    }

    // Delete the upvote and potentially unlike the clothing item in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the upvote
      await tx.submissionUpvote.delete({
        where: {
          submissionId_userId: {
            submissionId,
            userId: user.id
          }
        }
      });

      // If this submission has a clothing item, also unlike it (if liked)
      if (existingUpvote.submission.clothingItemId) {
        const existingLike = await tx.clothingItemLike.findUnique({
          where: {
            clothingItemId_userId: {
              clothingItemId: existingUpvote.submission.clothingItemId,
              userId: user.id
            }
          }
        });

        if (existingLike) {
          await tx.clothingItemLike.delete({
            where: {
              clothingItemId_userId: {
                clothingItemId: existingUpvote.submission.clothingItemId,
                userId: user.id
              }
            }
          });
        }
      }
    });

    // Check if user now has less than 3 upvotes for this challenge within their competition room
    const userUpvoteCount = await prisma.submissionUpvote.count({
      where: {
        userId: user.id,
        submission: {
          challengeId: existingUpvote.submission.challengeId,
          competitionRoomId: existingUpvote.submission.competitionRoomId
        }
      }
    });

    // If user has less than 3 upvotes in their room, make all their submissions for this challenge ineligible for competition
    if (userUpvoteCount < 3) {
      await prisma.challengeSubmission.updateMany({
        where: {
          challengeId: existingUpvote.submission.challengeId,
          userId: user.id,
          isEligibleForCompetition: true
        },
        data: {
          isEligibleForCompetition: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      upvoteCount: userUpvoteCount,
      isEligibleForCompetition: userUpvoteCount >= 3
    });
  } catch (error) {
    console.error('Error deleting upvote:', error);
    return NextResponse.json(
      { error: 'Failed to delete upvote' },
      { status: 500 }
    );
  }
} 
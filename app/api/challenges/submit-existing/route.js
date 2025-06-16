import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { assignUserToCompetitionRoom } from '@/services/competitionRoomService';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const EASTERN_TIMEZONE = 'America/New_York';

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

    const { 
      challengeId, 
      clothingItemId
    } = await request.json();

    // Validate required fields
    if (!challengeId || !clothingItemId) {
      return NextResponse.json({ 
        error: 'Challenge ID and clothing item ID are required' 
      }, { status: 400 });
    }

    // Verify the clothing item exists and belongs to user
    const clothingItem = await prisma.clothingItem.findUnique({
      where: { id: clothingItemId }
    });

    if (!clothingItem || clothingItem.creatorId !== user.id) {
      return NextResponse.json({ 
        error: 'Clothing item not found or you do not have permission to submit it' 
      }, { status: 400 });
    }

    // Verify the challenge exists
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return NextResponse.json({ 
        error: 'Challenge not found' 
      }, { status: 404 });
    }

    // Check if we're within the submission period
    const nowET = dayjs().tz(EASTERN_TIMEZONE);
    const competitionStart = challenge.competitionStart ? 
      dayjs.utc(challenge.competitionStart).tz(EASTERN_TIMEZONE) : 
      dayjs.tz(challenge.date, EASTERN_TIMEZONE);
    const submissionDeadline = dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE);

    if (nowET < competitionStart) {
      return NextResponse.json({ 
        error: 'Challenge has not started yet' 
      }, { status: 400 });
    }

    if (nowET > submissionDeadline) {
      return NextResponse.json({ 
        error: 'Submission deadline has passed' 
      }, { status: 400 });
    }

    // Check if user already has a submission for this challenge (regardless of which design)
    const existingChallengeSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId,
        userId: user.id
      }
    });

    if (existingChallengeSubmission) {
      return NextResponse.json({ 
        error: 'You have already submitted to this challenge' 
      }, { status: 400 });
    }

    // Assign user to a competition room for this challenge
    const competitionRoom = await assignUserToCompetitionRoom(user.id, challengeId);

    // Create challenge submission
    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId: challengeId,
        userId: user.id,
        competitionRoomId: competitionRoom.id,
        clothingItemId: clothingItemId,
        groupId: null, // This is a global challenge submission, not a group submission
        outfitDescription: clothingItem.description,
        generatedImageUrl: clothingItem.frontImage || clothingItem.imageUrl,
        generationStatus: 'COMPLETED',
        isPublic: true,
        isEligibleForCompetition: false // Will become true when they upvote 3 others in their room
      },
      include: {
        challenge: {
          select: {
            id: true,
            mainItem: true,
            theme: true,
            date: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        outfitDescription: submission.outfitDescription,
        generatedImageUrl: submission.generatedImageUrl,
        clothingItemId: submission.clothingItemId,
        submittedAt: submission.submittedAt,
        challenge: submission.challenge,
        user: submission.user,
        isEligibleForCompetition: submission.isEligibleForCompetition
      }
    });
  } catch (error) {
    console.error('Error submitting existing design to challenge:', error);
    return NextResponse.json(
      { error: 'Failed to submit design to challenge' },
      { status: 500 }
    );
  }
} 
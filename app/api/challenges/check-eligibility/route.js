import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const EASTERN_TIMEZONE = 'America/New_York';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clothingItemId = searchParams.get('clothingItemId');

    if (!clothingItemId) {
      return NextResponse.json({ 
        error: 'Clothing item ID is required' 
      }, { status: 400 });
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

    // Verify the clothing item exists and belongs to user
    const clothingItem = await prisma.clothingItem.findUnique({
      where: { id: clothingItemId }
    });

    if (!clothingItem || clothingItem.creatorId !== user.id) {
      return NextResponse.json({ 
        canSubmit: false,
        reason: 'Clothing item not found or you do not have permission to submit it'
      });
    }

    // Check if this clothing item has already been submitted to any challenge
    const existingSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        clothingItemId: clothingItemId,
        userId: user.id
      },
      include: {
        challenge: {
          select: {
            id: true,
            theme: true,
            date: true
          }
        }
      }
    });

    if (existingSubmission) {
      return NextResponse.json({ 
        canSubmit: false,
        reason: `This design has already been submitted to the "${existingSubmission.challenge.theme}" challenge on ${dayjs(existingSubmission.challenge.date).format('MMM D, YYYY')}. Each design can only be submitted once.`,
        usedInChallenge: {
          id: existingSubmission.challenge.id,
          theme: existingSubmission.challenge.theme,
          date: existingSubmission.challenge.date
        }
      });
    }

    // Get current active challenge
    const nowET = dayjs().tz(EASTERN_TIMEZONE);
    const todayStart = nowET.startOf('day');
    const todayEnd = nowET.endOf('day');

    const currentChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: todayStart.toDate(),
          lte: todayEnd.toDate(),
        },
      },
    });

    if (!currentChallenge) {
      return NextResponse.json({ 
        canSubmit: false,
        reason: 'No active challenge available today'
      });
    }

    // Check if we're within the submission period
    const competitionStart = currentChallenge.competitionStart ? 
      dayjs.utc(currentChallenge.competitionStart).tz(EASTERN_TIMEZONE) : 
      dayjs.tz(currentChallenge.date, EASTERN_TIMEZONE);
    const submissionDeadline = dayjs.utc(currentChallenge.submissionDeadline).tz(EASTERN_TIMEZONE);

    if (nowET < competitionStart) {
      return NextResponse.json({ 
        canSubmit: false,
        reason: 'Challenge has not started yet',
        challenge: {
          id: currentChallenge.id,
          theme: currentChallenge.theme,
          mainItem: currentChallenge.mainItem,
          startsAt: competitionStart.toISOString()
        }
      });
    }

    if (nowET > submissionDeadline) {
      return NextResponse.json({ 
        canSubmit: false,
        reason: 'Submission deadline has passed',
        challenge: {
          id: currentChallenge.id,
          theme: currentChallenge.theme,
          mainItem: currentChallenge.mainItem,
          deadlineAt: submissionDeadline.toISOString()
        }
      });
    }

    // Check if user already has a submission for this challenge
    const userChallengeSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId: currentChallenge.id,
        userId: user.id
      }
    });

    if (userChallengeSubmission) {
      return NextResponse.json({ 
        canSubmit: false,
        reason: 'You have already submitted to today\'s challenge',
        challenge: {
          id: currentChallenge.id,
          theme: currentChallenge.theme,
          mainItem: currentChallenge.mainItem
        }
      });
    }

    // All checks passed - item can be submitted
    // No need to check for friend groups since users are automatically assigned to competition rooms
    return NextResponse.json({ 
      canSubmit: true,
      challenge: {
        id: currentChallenge.id,
        theme: currentChallenge.theme,
        mainItem: currentChallenge.mainItem,
        description: currentChallenge.description,
        submissionDeadline: submissionDeadline.toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking challenge eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check challenge eligibility' },
      { status: 500 }
    );
  }
} 
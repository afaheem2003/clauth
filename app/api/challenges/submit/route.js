import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(timezone);
dayjs.extend(utc);

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
      groupId, 
      outfitDescription, 
      clothingItemId,
      generatedImageUrl 
    } = await request.json();

    // Validate required fields
    if (!challengeId || !groupId || !outfitDescription?.trim()) {
      return NextResponse.json({ 
        error: 'Challenge ID, group ID, and outfit description are required' 
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

    // Verify the group exists and user is a member
    const groupMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id
        }
      },
      include: {
        group: true
      }
    });

    if (!groupMember) {
      return NextResponse.json({ 
        error: 'You are not a member of this group' 
      }, { status: 403 });
    }

    // Check if user has already submitted for this challenge and group
    const existingSubmission = await prisma.challengeSubmission.findUnique({
      where: {
        challengeId_groupId_userId: {
          challengeId,
          groupId,
          userId: user.id
        }
      }
    });

    if (existingSubmission) {
      return NextResponse.json({ 
        error: 'You have already submitted for this challenge in this group' 
      }, { status: 400 });
    }

    // Verify clothing item exists and belongs to user (if provided)
    if (clothingItemId) {
      const clothingItem = await prisma.clothingItem.findUnique({
        where: { id: clothingItemId }
      });

      if (!clothingItem || clothingItem.creatorId !== user.id) {
        return NextResponse.json({ 
          error: 'Invalid clothing item' 
        }, { status: 400 });
      }
    }

    // Create challenge submission
    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId,
        groupId,
        userId: user.id,
        outfitDescription: outfitDescription.trim(),
        generatedImageUrl: generatedImageUrl || null,
        generationStatus: generatedImageUrl ? 'COMPLETED' : 'PENDING',
        isPublic: true,
        isEligibleForGlobal: false // Will become true when they upvote 3 others
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
        group: {
          select: {
            id: true,
            name: true,
            handle: true
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
        submittedAt: submission.submittedAt,
        challenge: submission.challenge,
        group: submission.group,
        user: submission.user,
        isEligibleForGlobal: submission.isEligibleForGlobal
      }
    });
  } catch (error) {
    console.error('Error submitting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to submit challenge entry' },
      { status: 500 }
    );
  }
} 
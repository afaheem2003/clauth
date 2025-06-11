import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const EASTERN_TIMEZONE = 'America/New_York';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Get user's group memberships
    const userGroupMemberships = await prisma.groupMember.findMany({
      where: {
        userId: session.user.uid,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            handle: true,
          }
        },
      },
    });

    // Get today's GLOBAL daily challenge
    const todayChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: dayjs().startOf('day').toDate(),
          lte: dayjs().endOf('day').toDate(),
        },
        submissionDeadline: {
          gte: now, // Only active challenges
        },
      },
    });

    if (!todayChallenge) {
      return NextResponse.json({ 
        activeChallenges: []
      });
    }

    // Check if user has already submitted to this challenge (GLOBALLY - only one submission allowed)
    const existingSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId: todayChallenge.id,
        userId: session.user.uid,
      },
    });

    // Return the global challenge with user's submission status and their groups
    const activeChallenges = [{
      id: todayChallenge.id,
      theme: todayChallenge.theme,
      mainItem: todayChallenge.mainItem,
      description: todayChallenge.description,
      submissionDeadline: todayChallenge.submissionDeadline,
      competitionStart: todayChallenge.competitionStart,
      competitionEnd: todayChallenge.competitionEnd,
      hasSubmitted: !!existingSubmission,
      userGroups: userGroupMemberships.map(membership => ({
        id: membership.group.id,
        name: membership.group.name,
        handle: membership.group.handle,
      }))
    }];

    return NextResponse.json({ 
      activeChallenges
    });

  } catch (error) {
    console.error('Error fetching user active challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

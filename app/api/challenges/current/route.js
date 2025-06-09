import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const EASTERN_TIMEZONE = 'America/New_York';

    // Get today's date in Eastern timezone for comparison
    const nowET = dayjs().tz(EASTERN_TIMEZONE);
    const year = nowET.year();
    const month = nowET.month(); // dayjs months are 0-indexed
    const day = nowET.date();
    const today = new Date(year, month, day);

    // Get today's challenge
    const challenge = await prisma.dailyChallenge.findFirst({
      where: { 
        date: today
      }
    });

    if (!challenge) {
      return NextResponse.json({
        success: true,
        challenge: null,
        message: 'No challenge scheduled for today'
      });
    }

    // Handle older challenges that might not have competitionStart field
    const competitionStart = challenge.competitionStart ? 
      dayjs.utc(challenge.competitionStart).tz(EASTERN_TIMEZONE) : 
      dayjs.tz(challenge.date, EASTERN_TIMEZONE);
    const submissionDeadline = dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE);
    const competitionEnd = challenge.competitionEnd ? 
      dayjs.utc(challenge.competitionEnd).tz(EASTERN_TIMEZONE) : 
      submissionDeadline;

    // If competition hasn't started yet, don't reveal the challenge
    if (challenge.competitionStart && nowET < competitionStart) {
      return NextResponse.json({
        success: true,
        challenge: null,
        message: 'Today\'s challenge will be revealed soon',
        timeUntilReveal: Math.max(0, competitionStart.diff(nowET, 'ms'))
      });
    }

    // Determine current phase
    const submissionsOpen = nowET < submissionDeadline;
    const votingOpen = nowET < competitionEnd;
    const challengeEnded = nowET >= competitionEnd;

    let phase = 'ended';
    if (submissionsOpen) {
      phase = 'submission'; // Users can submit and vote
    } else if (votingOpen) {
      phase = 'voting'; // Users can only vote
    }

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        date: challenge.date,
        mainItem: challenge.mainItem,
        theme: challenge.theme,
        description: challenge.description,
        submissionDeadline: challenge.submissionDeadline,
        competitionStart: challenge.competitionStart,
        competitionEnd: challenge.competitionEnd,
        phase,
        submissionsOpen,
        votingOpen,
        challengeEnded,
        timeRemaining: submissionsOpen ? 
          Math.max(0, submissionDeadline.diff(nowET, 'ms')) : 
          votingOpen ? Math.max(0, competitionEnd.diff(nowET, 'ms')) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching current challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current challenge' },
      { status: 500 }
    );
  }
} 
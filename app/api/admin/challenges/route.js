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

    // Check if user is admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const challenges = await prisma.dailyChallenge.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc'
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      challenges: challenges.map(challenge => ({
        id: challenge.id,
        date: challenge.date,
        mainItem: challenge.mainItem,
        theme: challenge.theme,
        description: challenge.description,
        submissionDeadline: challenge.submissionDeadline,
        competitionStart: challenge.competitionStart,
        competitionEnd: challenge.competitionEnd,
        submissionCount: challenge._count.submissions,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching admin challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      date, 
      mainItem, 
      theme, 
      description, 
      submissionDeadline, 
      competitionStart,
      competitionEnd
    } = await request.json();

    // Validate required fields
    if (!date || !theme || !submissionDeadline || !competitionStart || !competitionEnd) {
      return NextResponse.json({ 
        error: 'Date, theme, submission deadline, and competition dates are required' 
      }, { status: 400 });
    }

    const EASTERN_TIMEZONE = 'America/New_York';

    // Create challenge date directly from the selected date (no timezone conversion needed)
    const [year, month, day] = date.split('-').map(Number);
    const challengeDate = new Date(year, month - 1, day);

    const existingChallenge = await prisma.dailyChallenge.findFirst({
      where: { date: challengeDate }
    });

    if (existingChallenge) {
      return NextResponse.json({ 
        error: 'A challenge already exists for this date' 
      }, { status: 400 });
    }

    // Parse all times (they're already in UTC from the frontend conversion)
    const deadline = new Date(submissionDeadline);
    const compStart = new Date(competitionStart);
    const compEnd = new Date(competitionEnd);
    
    // Validate timeline logic
    if (compStart >= deadline) {
      return NextResponse.json({ 
        error: 'Submission deadline must be after challenge reveal time' 
      }, { status: 400 });
    }

    if (compEnd <= deadline) {
      return NextResponse.json({ 
        error: 'Voting deadline must be after submission deadline' 
      }, { status: 400 });
    }

    // Create challenge
    const challenge = await prisma.dailyChallenge.create({
      data: {
        date: challengeDate,
        mainItem: mainItem?.trim() || null,
        theme: theme.trim(),
        description: description?.trim() || null,
        submissionDeadline: deadline,
        competitionStart: compStart,
        competitionEnd: compEnd
      }
    });

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
        submissionCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
} 
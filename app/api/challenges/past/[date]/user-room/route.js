import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        room: null
      });
    }

    // Find the user's submission for this challenge
    const userSubmission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId: challenge.id,
        userId: session.user.id
      },
      include: {
        competitionRoom: true
      }
    });

    if (!userSubmission || !userSubmission.competitionRoom) {
      return NextResponse.json({
        success: true,
        room: null
      });
    }

    return NextResponse.json({
      success: true,
      room: {
        id: userSubmission.competitionRoom.id,
        roomNumber: userSubmission.competitionRoom.roomNumber,
        challengeId: challenge.id,
        challengeDate: challenge.date
      }
    });
  } catch (error) {
    console.error('Error fetching user competition room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competition room' },
      { status: 500 }
    );
  }
} 
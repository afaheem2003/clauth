import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getUserCompetitionRoom } from '@/services/competitionRoomService';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's challenge
    const todayChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: dayjs().startOf('day').toDate(),
          lte: dayjs().endOf('day').toDate(),
        },
      },
    });

    if (!todayChallenge) {
      return NextResponse.json({ 
        room: null 
      });
    }

    // Get user's competition room for today's challenge
    const room = await getUserCompetitionRoom(session.user.uid, todayChallenge.id);

    if (!room) {
      return NextResponse.json({ 
        room: null 
      });
    }

    // Get submission count for this room
    const submissionCount = await prisma.challengeSubmission.count({
      where: {
        competitionRoomId: room.id
      }
    });

    return NextResponse.json({
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        maxParticipants: room.maxParticipants,
        participantCount: room._count.participants,
        submissionCount: submissionCount,
        challengeId: todayChallenge.id
      }
    });

  } catch (error) {
    console.error('Error fetching user competition room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
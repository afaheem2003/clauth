import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = params.id;
    
    // Get room details
    const room = await prisma.competitionRoom.findUnique({
      where: { id: roomId },
      include: {
        challenge: true,
        _count: {
          select: {
            participants: true,
            submissions: true
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user is a participant in this room
    const isParticipant = await prisma.competitionParticipant.findFirst({
      where: {
        roomId: roomId,
        userId: session.user.uid
      }
    });

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const roomData = {
      id: room.id,
      roomNumber: room.roomNumber,
      participantCount: room._count.participants,
      submissionCount: room._count.submissions,
      maxParticipants: room.maxParticipants,
      createdAt: room.createdAt
    };

    return NextResponse.json({
      room: roomData,
      challenge: room.challenge
    });

  } catch (error) {
    console.error('Error fetching competition room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competition room' },
      { status: 500 }
    );
  }
} 
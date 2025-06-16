import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { getChallengeRoomStats } from '@/services/competitionRoomService';

export async function GET(request, { params }) {
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

    const challengeId = params.id;

    // Verify the challenge exists
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        theme: true,
        mainItem: true,
        date: true
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get room statistics
    const roomStats = await getChallengeRoomStats(challengeId);

    // Get detailed room information
    const rooms = await prisma.competitionRoom.findMany({
      where: {
        challengeId
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                email: true
              }
            }
          },
          orderBy: {
            assignedAt: 'asc'
          }
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            },
            _count: {
              select: {
                upvotes: true
              }
            }
          },
          orderBy: [
            { submittedAt: 'desc' }
          ]
        }
      },
      orderBy: {
        roomNumber: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      challenge,
      roomStats,
      rooms: rooms.map(room => ({
        id: room.id,
        roomNumber: room.roomNumber,
        maxParticipants: room.maxParticipants,
        participantCount: room.participants.length,
        submissionCount: room.submissions.length,
        participants: room.participants.map(p => ({
          id: p.id,
          userId: p.userId,
          assignedAt: p.assignedAt,
          user: p.user
        })),
        submissions: room.submissions.map(s => ({
          id: s.id,
          outfitDescription: s.outfitDescription,
          submittedAt: s.submittedAt,
          upvoteCount: s._count.upvotes,
          isEligibleForCompetition: s.isEligibleForCompetition,
          user: s.user
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching challenge room stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge room statistics' },
      { status: 500 }
    );
  }
} 
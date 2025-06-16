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

    // Get user's upvotes for submissions in this room
    const userUpvotes = await prisma.submissionUpvote.findMany({
      where: {
        userId: session.user.uid,
        submission: {
          competitionRoomId: roomId
        }
      },
      select: {
        submissionId: true
      }
    });

    const upvotedSubmissionIds = userUpvotes.map(upvote => upvote.submissionId);

    return NextResponse.json({
      upvotedSubmissionIds,
      upvoteCount: upvotedSubmissionIds.length
    });

  } catch (error) {
    console.error('Error fetching user upvotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user upvotes' },
      { status: 500 }
    );
  }
} 
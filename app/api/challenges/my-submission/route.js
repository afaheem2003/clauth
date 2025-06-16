import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

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
        submission: null 
      });
    }

    // Get user's submission for today's challenge
    const submission = await prisma.challengeSubmission.findFirst({
      where: {
        challengeId: todayChallenge.id,
        userId: session.user.uid,
      },
      include: {
        challenge: {
          select: {
            id: true,
            theme: true,
            mainItem: true,
            date: true
          }
        },
        _count: {
          select: {
            upvotes: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ 
        submission: null 
      });
    }

    // Fetch clothing item if clothingItemId exists
    let clothingItem = null;
    if (submission.clothingItemId) {
      clothingItem = await prisma.clothingItem.findUnique({
        where: { id: submission.clothingItemId },
        select: {
          id: true,
          description: true,
          frontImage: true,
          backImage: true,
          imageUrl: true
        }
      });
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        outfitDescription: clothingItem?.description || submission.outfitDescription,
        generatedImageUrl: clothingItem?.frontImage || clothingItem?.imageUrl || submission.generatedImageUrl,
        clothingItemId: submission.clothingItemId,
        submittedAt: submission.submittedAt,
        upvoteCount: submission._count.upvotes,
        challenge: submission.challenge
      }
    });

  } catch (error) {
    console.error('Error fetching user submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
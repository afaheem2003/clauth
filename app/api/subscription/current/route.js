import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database using uid (primary) or email (fallback)
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

    // Get user's current subscription from UserCredits table
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId: user.id }
    });

    // Map subscriptionType to plan name for consistency
    let planName = 'starter'; // default
    if (userCredits?.subscriptionType) {
      switch (userCredits.subscriptionType) {
        case 'CREATOR':
          planName = 'creator';
          break;
        case 'CREATOR_PRO':
          planName = 'pro_creator';
          break;
        case 'FREE':
        default:
          planName = 'starter';
          break;
      }
    }

    return NextResponse.json({
      plan: planName,
      subscriptionType: userCredits?.subscriptionType || 'FREE',
      mediumCredits: userCredits?.mediumCredits || 0,
      highCredits: userCredits?.highCredits || 0,
      dailyMediumCap: userCredits?.dailyMediumCap || 15,
      dailyHighCap: userCredits?.dailyHighCap || null,
      lastReset: userCredits?.lastReset || null
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
} 
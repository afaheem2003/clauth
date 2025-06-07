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

    // Get user's current credits
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId: user.id }
    });

    // Get recent credit transactions
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId
      },
      userCredits,
      recentTransactions,
      debug: {
        hasUserCredits: !!userCredits,
        subscriptionType: userCredits?.subscriptionType || 'NONE',
        creditsFound: userCredits ? true : false
      }
    });
  } catch (error) {
    console.error('Error fetching debug data:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data', details: error.message }, { status: 500 });
  }
} 
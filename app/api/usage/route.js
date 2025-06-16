import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getUserCredits } from '@/lib/rateLimiting';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.uid) {
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

    // ✅ Use getUserCredits which automatically initializes credits for new users
    const { credits, plan } = await getUserCredits(user.id);

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsage = await prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      }
    });

    const lowUsedToday = dailyUsage?.lowGenerations || 0;
    const mediumUsedToday = dailyUsage?.mediumGenerations || 0;
    const highUsedToday = dailyUsage?.highGenerations || 0;

    // Build stats using the credits and plan from getUserCredits
    const stats = {
      // Credit balances from initialized credits record
      lowCredits: credits.lowCredits,
      mediumCredits: credits.mediumCredits,
      highCredits: credits.highCredits,
      
      // Daily usage and caps from plan config
      lowUsedToday,
      mediumUsedToday,
      highUsedToday,
      dailyLowCap: plan.dailyLowCap,
      dailyMediumCap: plan.dailyMediumCap,
      dailyHighCap: plan.dailyHighCap,
      
      // Plan info from centralized config
      plan: plan.displayName,
      
      // Reset times
      creditsResetTime: new Date(today.getFullYear(), today.getMonth() + 1, 1), // Next month
      dailyResetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    };
    
    return NextResponse.json({
      success: true,
      usage: stats
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
} 
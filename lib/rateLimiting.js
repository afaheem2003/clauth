import { prisma } from './prisma';

/**
 * Get user's current subscription plan and daily limit
 */
export async function getUserDailyLimit(userId) {
  try {
    // Get user's subscription or default to free plan
    let subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    // If no subscription, assign free plan
    if (!subscription) {
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { name: 'free' }
      });

      if (freePlan) {
        subscription = await prisma.userSubscription.create({
          data: {
            userId,
            planId: freePlan.id,
            status: 'ACTIVE'
          },
          include: { plan: true }
        });
      } else {
        // Fallback if no free plan exists
        return { limit: 10, plan: { displayName: 'Free Plan' } };
      }
    }

    return {
      limit: subscription.plan.dailyGenerations,
      plan: subscription.plan
    };
  } catch (error) {
    console.error('Error getting user daily limit:', error);
    // Fallback to free tier limit
    return { limit: 10, plan: { displayName: 'Free Plan' } };
  }
}

/**
 * Check if user can make a generation (within daily limit)
 */
export async function canUserGenerate(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Get user's daily limit
    const { limit } = await getUserDailyLimit(userId);

    // Get today's usage
    const usage = await prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    const currentUsage = usage?.generations || 0;
    const canGenerate = currentUsage < limit;

    return {
      canGenerate,
      currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage)
    };
  } catch (error) {
    console.error('Error checking user generation limit:', error);
    return {
      canGenerate: false,
      currentUsage: 0,
      limit: 10,
      remaining: 0
    };
  }
}

/**
 * Increment user's daily usage count
 */
export async function incrementUserUsage(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    const usage = await prisma.dailyUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        generations: {
          increment: 1
        }
      },
      create: {
        userId,
        date: today,
        generations: 1
      }
    });

    return usage;
  } catch (error) {
    console.error('Error incrementing user usage:', error);
    throw error;
  }
}

/**
 * Get user's usage stats for display
 */
export async function getUserUsageStats(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ limit, plan }, usage] = await Promise.all([
      getUserDailyLimit(userId),
      prisma.dailyUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      })
    ]);

    const currentUsage = usage?.generations || 0;

    return {
      currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage),
      plan: plan.displayName,
      resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
    };
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    return {
      currentUsage: 0,
      limit: 10,
      remaining: 10,
      plan: 'Free Plan',
      resetTime: new Date()
    };
  }
} 
import { prisma } from './prisma';
import { getPlanBySubscriptionType } from './plans';

/**
 * Credit Management Service for the new credit-based system
 */

/**
 * Get user's current subscription plan and credit limits
 */
export async function getUserCreditLimits(userId) {
  try {
    // Get user's current subscription from UserCredits table
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId }
    });

    if (userCredits?.subscriptionType) {
      // Get plan configuration from centralized config
      const planData = getPlanBySubscriptionType(userCredits.subscriptionType);
      
      return {
        plan: planData,
        monthlyLowCredits: planData.monthlyLowCredits,
        monthlyMediumCredits: planData.monthlyMediumCredits,
        monthlyHighCredits: planData.monthlyHighCredits
      };
    }

    // Fallback to free plan if no subscription found
    const freePlan = getPlanBySubscriptionType('FREE');
    return { 
      plan: freePlan,
      monthlyLowCredits: freePlan.monthlyLowCredits,
      monthlyMediumCredits: freePlan.monthlyMediumCredits,
      monthlyHighCredits: freePlan.monthlyHighCredits
    };
  } catch (error) {
    console.error('Error getting user credit limits:', error);
    // Fallback to starter plan limits
    const freePlan = getPlanBySubscriptionType('FREE');
    return { 
      plan: freePlan,
      monthlyLowCredits: freePlan.monthlyLowCredits,
      monthlyMediumCredits: freePlan.monthlyMediumCredits,
      monthlyHighCredits: freePlan.monthlyHighCredits
    };
  }
}

/**
 * Get user's current credit balance and ensure monthly refill
 */
export async function getUserCredits(userId) {
  try {
    const { plan, monthlyLowCredits, monthlyMediumCredits, monthlyHighCredits } = await getUserCreditLimits(userId);
    
    // Get or create user credits record
    let credits = await prisma.userCredits.findUnique({
      where: { userId }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (!credits) {
      // Create new credits record with initial allocation
      credits = await prisma.userCredits.create({
        data: {
          userId,
          lowCredits: monthlyLowCredits,
          mediumCredits: monthlyMediumCredits,
          highCredits: monthlyHighCredits,
          lastMonthlyRefill: startOfMonth
        }
      });

      // Log the initial credit allocation
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: 'MONTHLY_REFILL',
          lowCreditsChange: monthlyLowCredits,
          mediumCreditsChange: monthlyMediumCredits,
          highCreditsChange: monthlyHighCredits,
          reason: 'Initial credit allocation'
        }
      });
    } else {
      // Check if we need to refill monthly credits
      const lastRefill = credits.lastMonthlyRefill || new Date(0);
      if (lastRefill < startOfMonth) {
        // Refill monthly credits
        credits = await prisma.userCredits.update({
          where: { userId },
          data: {
            lowCredits: monthlyLowCredits,
            mediumCredits: monthlyMediumCredits,
            highCredits: monthlyHighCredits,
            lastMonthlyRefill: startOfMonth
          }
        });

        // Log the monthly refill
        await prisma.creditTransaction.create({
          data: {
            userId,
            type: 'MONTHLY_REFILL',
            lowCreditsChange: monthlyLowCredits,
            mediumCreditsChange: monthlyMediumCredits,
            highCreditsChange: monthlyHighCredits,
            reason: `Monthly credit refill for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          }
        });
      }
    }

    return { credits, plan };
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

/**
 * Check if user can make a generation of specified quality
 */
export async function canUserGenerate(userId, quality = 'medium') {
  try {
    const { credits, plan } = await getUserCredits(userId);
    
    // Check if user has sufficient credits
    const hasCredits = quality === 'high' 
      ? credits.highCredits > 0 
      : quality === 'low'
      ? credits.lowCredits > 0
      : credits.mediumCredits > 0;

    if (!hasCredits) {
      return {
        canGenerate: false,
        reason: `Insufficient ${quality} credits`,
        creditsRemaining: quality === 'high' ? credits.highCredits : quality === 'low' ? credits.lowCredits : credits.mediumCredits,
        dailyRemaining: 0
      };
    }

    // Check daily caps
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsage = await prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    const currentDailyUsage = quality === 'high' 
      ? (dailyUsage?.highGenerations || 0)
      : quality === 'low'
      ? (dailyUsage?.lowGenerations || 0)
      : (dailyUsage?.mediumGenerations || 0);

    const dailyCap = quality === 'high' ? plan.dailyHighCap : quality === 'low' ? plan.dailyLowCap : plan.dailyMediumCap;
    
    // If there's a daily cap and it's exceeded
    if (dailyCap !== null && currentDailyUsage >= dailyCap) {
      return {
        canGenerate: false,
        reason: `Daily ${quality} generation limit reached`,
        creditsRemaining: quality === 'high' ? credits.highCredits : quality === 'low' ? credits.lowCredits : credits.mediumCredits,
        dailyRemaining: 0
      };
    }

    const dailyRemaining = dailyCap !== null ? dailyCap - currentDailyUsage : null;

    return {
      canGenerate: true,
      creditsRemaining: quality === 'high' ? credits.highCredits : quality === 'low' ? credits.lowCredits : credits.mediumCredits,
      dailyRemaining
    };
  } catch (error) {
    console.error('Error checking user generation capability:', error);
    return {
      canGenerate: false,
      reason: 'Error checking limits',
      creditsRemaining: 0,
      dailyRemaining: 0
    };
  }
}

/**
 * Consume credits for a generation
 */
export async function consumeCreditsForGeneration(userId, quality = 'medium') {
  try {
    const { credits } = await getUserCredits(userId);
    
    // Deduct credit
    const creditField = quality === 'high' ? 'highCredits' : quality === 'low' ? 'lowCredits' : 'mediumCredits';
    const currentCredits = credits[creditField];
    
    if (currentCredits <= 0) {
      throw new Error(`Insufficient ${quality} credits`);
    }

    // Update credit balance
    const updateData = {};
    updateData[creditField] = currentCredits - 1;
    
    await prisma.userCredits.update({
      where: { userId },
      data: updateData
    });

    // Record the transaction
    const creditChange = {};
    creditChange[`${quality === 'high' ? 'high' : quality === 'low' ? 'low' : 'medium'}CreditsChange`] = -1;
    
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'GENERATION_USED',
        ...creditChange,
        reason: `${quality.charAt(0).toUpperCase() + quality.slice(1)} quality generation`
      }
    });

    // Update daily usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsageField = quality === 'high' ? 'highGenerations' : quality === 'low' ? 'lowGenerations' : 'mediumGenerations';

    await prisma.dailyUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      create: {
        userId,
        date: today,
        [dailyUsageField]: 1
      },
      update: {
        [dailyUsageField]: {
          increment: 1
        }
      }
    });

    console.log(`[Rate Limited] Consumed 1 ${quality} credit for user ${userId}. Remaining: ${currentCredits - 1}`);

    return {
      success: true,
      creditsRemaining: currentCredits - 1
    };
  } catch (error) {
    console.error('Error consuming credits for generation:', error);
    throw error;
  }
}

/**
 * Get comprehensive user usage stats for display
 */
export async function getUserUsageStats(userId) {
  try {
    const { credits, plan } = await getUserCredits(userId);
    
    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsage = await prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    const lowUsedToday = dailyUsage?.lowGenerations || 0;
    const mediumUsedToday = dailyUsage?.mediumGenerations || 0;
    const highUsedToday = dailyUsage?.highGenerations || 0;

    return {
      // Credit balances
      lowCredits: credits.lowCredits,
      mediumCredits: credits.mediumCredits,
      highCredits: credits.highCredits,
      
      // Daily usage and caps
      lowUsedToday,
      mediumUsedToday,
      highUsedToday,
      dailyLowCap: plan.dailyLowCap,
      dailyMediumCap: plan.dailyMediumCap,
      dailyHighCap: plan.dailyHighCap,
      
      // Plan info
      plan: plan.displayName,
      
      // Reset times
      creditsResetTime: new Date(today.getFullYear(), today.getMonth() + 1, 1), // Next month
      dailyResetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    };
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    return {
      lowCredits: 0,
      mediumCredits: 0,
      highCredits: 0,
      lowUsedToday: 0,
      mediumUsedToday: 0,
      highUsedToday: 0,
      dailyLowCap: 25,
      dailyMediumCap: 15,
      dailyHighCap: null,
      plan: 'Starter',
      creditsResetTime: new Date(),
      dailyResetTime: new Date()
    };
  }
}

/**
 * Refund credits for a failed generation (safety mechanism)
 */
export async function refundCreditsForFailedGeneration(userId, quality = 'medium', reason = 'Generation failed') {
  try {
    const { credits } = await getUserCredits(userId);
    
    // Add credit back
    const creditField = quality === 'high' ? 'highCredits' : quality === 'low' ? 'lowCredits' : 'mediumCredits';
    const currentCredits = credits[creditField];
    
    // Update credit balance
    const updateData = {};
    updateData[creditField] = currentCredits + 1;
    
    await prisma.userCredits.update({
      where: { userId },
      data: updateData
    });

    // Record the refund transaction
    const creditChange = {};
    creditChange[`${quality === 'high' ? 'high' : quality === 'low' ? 'low' : 'medium'}CreditsChange`] = 1;
    
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'REFUND',
        ...creditChange,
        reason: `Credit refund: ${reason}`
      }
    });

    // Decrement daily usage since the generation failed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsageField = quality === 'high' ? 'highGenerations' : quality === 'low' ? 'lowGenerations' : 'mediumGenerations';

    const dailyUsage = await prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    if (dailyUsage && dailyUsage[dailyUsageField] > 0) {
      await prisma.dailyUsage.update({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        data: {
          [dailyUsageField]: {
            decrement: 1
          }
        }
      });
    }

    console.log(`[Rate Limited] Refunded 1 ${quality} credit for user ${userId}. New balance: ${currentCredits + 1}`);

    return {
      success: true,
      creditsRefunded: 1,
      newBalance: currentCredits + 1
    };
  } catch (error) {
    console.error('Error refunding credits for failed generation:', error);
    throw error;
  }
} 
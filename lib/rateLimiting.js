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
        monthlyMediumCredits: planData.monthlyMediumCredits,
        monthlyHighCredits: planData.monthlyHighCredits
      };
    }

    // Fallback to free plan if no subscription found
    const freePlan = getPlanBySubscriptionType('FREE');
    return { 
      plan: freePlan,
      monthlyMediumCredits: freePlan.monthlyMediumCredits,
      monthlyHighCredits: freePlan.monthlyHighCredits
    };
  } catch (error) {
    console.error('Error getting user credit limits:', error);
    // Fallback to starter plan limits
    const freePlan = getPlanBySubscriptionType('FREE');
    return { 
      plan: freePlan,
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
    const { plan, monthlyMediumCredits, monthlyHighCredits } = await getUserCreditLimits(userId);
    
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
      : credits.mediumCredits > 0;

    if (!hasCredits) {
      return {
        canGenerate: false,
        reason: `Insufficient ${quality} credits`,
        creditsRemaining: quality === 'high' ? credits.highCredits : credits.mediumCredits,
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
      : (dailyUsage?.mediumGenerations || 0);

    const dailyCap = quality === 'high' ? plan.dailyHighCap : plan.dailyMediumCap;
    
    // If there's a daily cap and it's exceeded
    if (dailyCap !== null && currentDailyUsage >= dailyCap) {
      return {
        canGenerate: false,
        reason: `Daily ${quality} generation limit reached`,
        creditsRemaining: quality === 'high' ? credits.highCredits : credits.mediumCredits,
        dailyRemaining: 0
      };
    }

    const dailyRemaining = dailyCap !== null ? dailyCap - currentDailyUsage : null;

    return {
      canGenerate: true,
      creditsRemaining: quality === 'high' ? credits.highCredits : credits.mediumCredits,
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
    const creditField = quality === 'high' ? 'highCredits' : 'mediumCredits';
    const currentCredits = credits[creditField];
    
    if (currentCredits <= 0) {
      throw new Error(`Insufficient ${quality} credits`);
    }

    // Update credits
    await prisma.userCredits.update({
      where: { userId },
      data: {
        [creditField]: currentCredits - 1
      }
    });

    // Update daily usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        [quality === 'high' ? 'highGenerations' : 'mediumGenerations']: {
          increment: 1
        }
      },
      create: {
        userId,
        date: today,
        [quality === 'high' ? 'highGenerations' : 'mediumGenerations']: 1
      }
    });

    // Log the transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'GENERATION_USED',
        [quality === 'high' ? 'highCreditsChange' : 'mediumCreditsChange']: -1,
        reason: `${quality} quality generation`
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error consuming credits:', error);
    throw error;
  }
}

/**
 * Check if user can edit a design (based on edit cap per design)
 */
export async function canUserEdit(userId, designSession) {
  try {
    const { plan } = await getUserCreditLimits(userId);
    
    // Get current edit count for this design session
    const editHistory = await prisma.designEditHistory.findFirst({
      where: {
        userId,
        designSession
      }
    });

    const currentEdits = editHistory?.editCount || 0;
    const canEdit = currentEdits < plan.editCapPerDesign;

    return {
      canEdit,
      currentEdits,
      maxEdits: plan.editCapPerDesign,
      editsRemaining: plan.editCapPerDesign - currentEdits
    };
  } catch (error) {
    console.error('Error checking edit capability:', error);
    return {
      canEdit: false,
      currentEdits: 0,
      maxEdits: 3,
      editsRemaining: 0
    };
  }
}

/**
 * Consume an edit for a design
 */
export async function consumeEditForDesign(userId, designSession, originalPrompt, clothingItemId = null) {
  try {
    // Check if edit history exists for this design session
    let editHistory = await prisma.designEditHistory.findFirst({
      where: {
        userId,
        designSession
      }
    });

    if (editHistory) {
      // Update existing edit history
      editHistory = await prisma.designEditHistory.update({
        where: { id: editHistory.id },
        data: {
          editCount: editHistory.editCount + 1,
          clothingItemId: clothingItemId || editHistory.clothingItemId
        }
      });
    } else {
      // Create new edit history
      editHistory = await prisma.designEditHistory.create({
        data: {
          userId,
          designSession,
          originalPrompt,
          editCount: 1,
          clothingItemId
        }
      });
    }

    // Log the transaction (edits don't consume credits, just count towards limit)
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'EDIT_USED',
        mediumCreditsChange: 0,
        highCreditsChange: 0,
        reason: `Design edit for session ${designSession}`,
        relatedId: designSession
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error consuming edit:', error);
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

    const mediumUsedToday = dailyUsage?.mediumGenerations || 0;
    const highUsedToday = dailyUsage?.highGenerations || 0;

    return {
      // Credit balances
      mediumCredits: credits.mediumCredits,
      highCredits: credits.highCredits,
      
      // Daily usage and caps
      mediumUsedToday,
      highUsedToday,
      dailyMediumCap: plan.dailyMediumCap,
      dailyHighCap: plan.dailyHighCap,
      
      // Plan info
      plan: plan.displayName,
      editCapPerDesign: plan.editCapPerDesign,
      
      // Reset times
      creditsResetTime: new Date(today.getFullYear(), today.getMonth() + 1, 1), // Next month
      dailyResetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    };
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    return {
      mediumCredits: 0,
      highCredits: 0,
      mediumUsedToday: 0,
      highUsedToday: 0,
      dailyMediumCap: 15,
      dailyHighCap: null,
      plan: 'Starter',
      editCapPerDesign: 3,
      creditsResetTime: new Date(),
      dailyResetTime: new Date()
    };
  }
} 
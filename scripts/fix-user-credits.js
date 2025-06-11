const { PrismaClient } = require('@prisma/client');
const { getPlanBySubscriptionType } = require('../lib/plans');

const prisma = new PrismaClient();

async function fixUserCredits() {
  try {
    console.log('Fixing user credits...');
    
    // Get all users with credit records
    const users = await prisma.userCredits.findMany({
      where: {
        lowCredits: 0 // Users who don't have low credits yet
      }
    });
    
    console.log(`Found ${users.length} users to update`);

    for (const userCredit of users) {
      const plan = getPlanBySubscriptionType(userCredit.subscriptionType);
      
      // Update user with proper low credits
      await prisma.userCredits.update({
        where: { userId: userCredit.userId },
        data: {
          lowCredits: plan.monthlyLowCredits,
          lastMonthlyRefill: new Date() // Reset refill date
        }
      });

      // Log the credit transaction
      await prisma.creditTransaction.create({
      data: {
          userId: userCredit.userId,
          type: 'MONTHLY_REFILL',
          lowCreditsChange: plan.monthlyLowCredits,
          mediumCreditsChange: 0,
          highCreditsChange: 0,
          reason: 'Sketch credits added - system update'
      }
    });
    
      console.log(`Updated user ${userCredit.userId} with ${plan.monthlyLowCredits} sketch credits`);
    }

    console.log('Credit fix completed!');
  } catch (error) {
    console.error('Error fixing credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCredits(); 
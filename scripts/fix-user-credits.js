const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserCredits() {
  try {
    console.log('🔧 Fixing user credits record...');
    
    // Find the user
    const userId = 'cmb8oc46r0000qmfbiheqhse7';
    
    // Check current state
    const currentCredits = await prisma.userCredits.findUnique({
      where: { userId }
    });
    
    console.log('📊 Current credits record:', currentCredits);
    
    // Update with subscription fields
    const updatedCredits = await prisma.userCredits.update({
      where: { userId },
      data: {
        subscriptionType: 'FREE',
        dailyMediumCap: 15,
        dailyHighCap: null,
        lastReset: null
      }
    });
    
    console.log('✅ Updated credits record:', updatedCredits);
    
  } catch (error) {
    console.error('❌ Error fixing user credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCredits(); 
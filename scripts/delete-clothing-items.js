const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllClothingItems() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: 'afaheem2003@gmail.com'
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Delete all clothing items for this user
    const result = await prisma.clothingItem.deleteMany({
      where: {
        creatorId: user.id
      }
    });

    console.log(`Successfully deleted ${result.count} clothing items`);
  } catch (error) {
    console.error('Error deleting clothing items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllClothingItems(); 
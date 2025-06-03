const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteToAdmin() {
  try {
    const email = 'afaheem2003@gmail.com';
    
    // Update the user's role to ADMIN
    const updatedUser = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        role: 'ADMIN',
      },
    });

    console.log(`Successfully promoted ${email} to admin role!`);
    console.log('Updated user:', updatedUser);
  } catch (error) {
    console.error('Error promoting user to admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin(); 
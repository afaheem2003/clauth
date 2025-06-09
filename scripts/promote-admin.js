const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteToAdmin() {
  try {
    const email = 'afaheem2003@gmail.com';
    
    console.log(`Looking for user with email: ${email}`);
    
    // First, check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true
      }
    });

    if (!existingUser) {
      console.log(`❌ User with email ${email} not found.`);
      console.log('Available users:');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          displayName: true,
          role: true
        }
      });
      console.table(allUsers);
      return;
    }

    console.log('Found user:', existingUser);

    if (existingUser.role === 'ADMIN') {
      console.log(`✅ User ${email} is already an admin!`);
      return;
    }
    
    // Update the user's role to ADMIN
    const updatedUser = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true
      }
    });

    console.log(`✅ Successfully promoted ${email} to admin role!`);
    console.log('Updated user:', updatedUser);
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
    
    if (error.code === 'P2025') {
      console.log('User not found. Please check the email address.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin(); 
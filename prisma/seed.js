// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Upsert admin user - creates if doesn't exist, updates if exists
  const adminUser = await prisma.user.upsert({
    where: { email: 'afaheem2003@gmail.com' },
    update: {
      role: 'ADMIN',
      waitlistStatus: 'APPROVED',
    },
    create: {
      email: 'afaheem2003@gmail.com',
      name: 'Aadam Faheem',
      displayName: 'afaheem',
      role: 'ADMIN',
      waitlistStatus: 'APPROVED',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user ensured:', adminUser.email, '- Role:', adminUser.role, '- Status:', adminUser.waitlistStatus)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    // Don't exit with error code to avoid breaking the build
    // Seed failures shouldn't prevent deployment
    console.log('⚠️  Continuing despite seed error...')
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

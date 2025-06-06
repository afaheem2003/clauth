// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Promote user to admin
  await prisma.user.update({
    where: { email: 'afaheem2003@gmail.com' },
    data: { role: 'ADMIN' },
  })

  // Create free subscription plan
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Free Plan',
      price: 0,
      dailyGenerations: 10,
      features: [
        '10 generations/edits per day',
        'AI design assistance',
        'Standard image quality',
        'Community support'
      ],
      isActive: true,
    },
  })

  console.log('✅ Free plan created:', freePlan.id)
  console.log('💡 Paid tiers can be added later when ready to monetize')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

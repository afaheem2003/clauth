// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Promote user to admin
  await prisma.user.update({
    where: { email: 'afaheem2003@gmail.com' },
    data: { role: 'ADMIN' },
  })

  // Create subscription plans based on the new credit system
  
  // Starter Plan (Free)
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter',
      displayName: 'Starter',
      price: 0,
      monthlyMediumCredits: 120,
      monthlyHighCredits: 5,
      dailyMediumCap: 15,
      dailyHighCap: null, // No daily cap on high credits
      editCapPerDesign: 3,
      features: [
        '120 Medium + 5 High credits per month',
        '15 Medium generations per day',
        'No daily cap on High credits',
        '3 edits per design',
        'AI design assistance',
        'Community support'
      ],
      isActive: true,
    },
  })

  // Creator Plan ($9)
  const creatorPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'creator' },
    update: {},
    create: {
      name: 'creator',
      displayName: 'Creator',
      price: 9,
      monthlyMediumCredits: 250,
      monthlyHighCredits: 20,
      dailyMediumCap: 30,
      dailyHighCap: 6,
      editCapPerDesign: 5,
      features: [
        '250 Medium + 20 High credits per month',
        '30 Medium / 6 High generations per day',
        '5 edits per design',
        'Priority AI processing',
        'Advanced design tools',
        'Email support'
      ],
      isActive: true,
    },
  })

  // Creator Pro Plan ($15)
  const proCreatorPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'pro_creator' },
    update: {},
    create: {
      name: 'pro_creator',
      displayName: 'Creator Pro',
      price: 15,
      monthlyMediumCredits: 500,
      monthlyHighCredits: 40,
      dailyMediumCap: 60,
      dailyHighCap: 10,
      editCapPerDesign: 5,
      features: [
        '500 Medium + 40 High credits per month',
        '60 Medium / 10 High generations per day',
        '5 edits per design',
        'Fastest AI processing',
        'Premium design tools',
        'Priority support',
        'Early access to new features'
      ],
      isActive: true,
    },
  })

  // Create booster packs
  
  // Medium Booster — Micro
  await prisma.boosterPack.upsert({
    where: { name: 'medium_micro' },
    update: {},
    create: {
      name: 'medium_micro',
      displayName: 'Medium Booster — Micro',
      price: 6,
      mediumCredits: 80,
      highCredits: 0,
      isActive: true,
    },
  })

  // Medium Booster — Bulk
  await prisma.boosterPack.upsert({
    where: { name: 'medium_bulk' },
    update: {},
    create: {
      name: 'medium_bulk',
      displayName: 'Medium Booster — Bulk',
      price: 10,
      mediumCredits: 200,
      highCredits: 0,
      isActive: true,
    },
  })

  // High Booster — Micro
  await prisma.boosterPack.upsert({
    where: { name: 'high_micro' },
    update: {},
    create: {
      name: 'high_micro',
      displayName: 'High Booster — Micro',
      price: 6,
      mediumCredits: 0,
      highCredits: 15,
      isActive: true,
    },
  })

  // High Booster — Bulk
  await prisma.boosterPack.upsert({
    where: { name: 'high_bulk' },
    update: {},
    create: {
      name: 'high_bulk',
      displayName: 'High Booster — Bulk',
      price: 12,
      mediumCredits: 0,
      highCredits: 40,
      isActive: true,
    },
  })

  console.log('✅ Credit-based subscription plans created:')
  console.log('  - Starter (Free): 120 Medium + 5 High credits/month')
  console.log('  - Creator ($9): 250 Medium + 20 High credits/month')
  console.log('  - Creator Pro ($15): 500 Medium + 40 High credits/month')
  console.log('')
  console.log('✅ Booster packs created:')
  console.log('  - Medium Micro ($6): +80 Medium credits')
  console.log('  - Medium Bulk ($10): +200 Medium credits')
  console.log('  - High Micro ($6): +15 High credits')
  console.log('  - High Bulk ($12): +40 High credits')
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

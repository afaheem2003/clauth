// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Promote user to admin
  await prisma.user.update({
    where: { email: 'afaheem2003@gmail.com' },
    data: { role: 'ADMIN' },
  })

  console.log('✅ Admin user promoted successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

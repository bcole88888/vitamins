import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default users (a married couple)
  const userA = await prisma.user.upsert({
    where: { id: 'user-a' },
    update: { name: 'Brian' },
    create: {
      id: 'user-a',
      name: 'Brian',
    },
  })

  const userB = await prisma.user.upsert({
    where: { id: 'user-b' },
    update: { name: 'Amanda' },
    create: {
      id: 'user-b',
      name: 'Amanda',
    },
  })

  console.log('Created users:', { userA, userB })
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

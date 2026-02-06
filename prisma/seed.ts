import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // No default users — users are created via the UI.
  const count = await prisma.user.count()
  console.log(`Database ready. ${count} user(s) exist.`)
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

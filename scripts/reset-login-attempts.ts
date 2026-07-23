import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const deleted = await prisma.loginAttempt.deleteMany({ where: { success: false } })
  console.log(`Deleted ${deleted.count} failed login attempt(s). You can now log in.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

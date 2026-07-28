import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateUsername(first: string, last: string, suffix?: string): string {
  const base = `${first.toLowerCase().replace(/[^a-z0-9]/g, '')}.${last.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  return suffix ? `${base}.${suffix}` : base
}

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  console.log(`Found ${users.length} users without a username. Backfilling...`)

  let updated = 0
  for (const user of users) {
    let username = generateUsername(user.firstName, user.lastName)
    let suffixAttempt = 0
    while (await prisma.user.findUnique({ where: { username } })) {
      suffixAttempt++
      username = generateUsername(user.firstName, user.lastName, `${Date.now().toString(36)}${suffixAttempt}`)
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    })
    updated++
    if (updated % 10 === 0) console.log(`  ${updated}/${users.length} done`)
  }

  console.log(`Done. ${updated} usernames backfilled.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

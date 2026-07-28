import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const groups = await prisma.package.groupBy({
    by: ['name'],
    _count: { id: true },
    _min: { createdAt: true },
  })

  const dupes = groups.filter(g => g._count.id > 1)

  if (dupes.length === 0) {
    console.log('No duplicate packages found.')
    return
  }

  for (const dupe of dupes) {
    const packages = await prisma.package.findMany({
      where: { name: dupe.name },
      orderBy: { createdAt: 'asc' },
    })

    const keep = packages[0]
    const toDelete = packages.slice(1)

    console.log(`Merging "${dupe.name}": keeping ${keep.id}, deleting ${toDelete.map(d => d.id).join(', ')}`)

    for (const del of toDelete) {
      const count = await prisma.subscription.updateMany({
        where: { packageId: del.id },
        data: { packageId: keep.id },
      })
      console.log(`  Reassigned ${count.count} subscriptions from ${del.id} to ${keep.id}`)
      await prisma.package.delete({ where: { id: del.id } })
    }
  }

  console.log('Deduplication complete.')
}

main().catch(console.error).finally(() => prisma.$disconnect())

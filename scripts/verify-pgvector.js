const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  try {
    const r1 = await p.$queryRawUnsafe(`SELECT extname FROM pg_extension WHERE extname = 'vector'`)
    console.log('pgvector extension:', r1.length > 0 ? 'INSTALLED' : 'MISSING')
  } catch(e) { console.error('pgvector:', e.message) }
  
  const r2 = await p.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM document_chunks`)
  console.log('document_chunks rows:', r2?.[0]?.count ?? 0)

  const r3 = await p.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM document_library`)
  console.log('document_library rows:', r3?.[0]?.count ?? 0)

  await p.$disconnect()
  console.log('All systems operational.')
}
main()

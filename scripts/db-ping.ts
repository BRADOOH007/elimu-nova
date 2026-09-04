import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main(){
  for (let i=0;i<5;i++){
    const t0=Date.now()
    try { await p.$queryRaw`SELECT 1`; console.log(`try ${i}: OK ${Date.now()-t0}ms`) }
    catch(e){ console.log(`try ${i}: ERR ${Date.now()-t0}ms`, (e as Error).message) }
  }
  await p.$disconnect()
}
main()

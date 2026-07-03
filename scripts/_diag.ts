import { PrismaClient } from '@prisma/client'
async function main() {
  const p = new PrismaClient()
  const stores = await p.offer.groupBy({ by: ['store'], _count: true })
  console.log('=== PRODUTOS POR LOJA ===')
  for (const s of stores) console.log(s.store + ': ' + s._count)
  const cats = await p.offer.groupBy({ by: ['category'], _count: true, orderBy: { _count: 'desc' } })
  console.log('\n=== TOP CATEGORIAS ===')
  for (const c of cats.slice(0, 20)) console.log('  ' + c.category + ': ' + c._count)
  await p.$disconnect()
}
main()

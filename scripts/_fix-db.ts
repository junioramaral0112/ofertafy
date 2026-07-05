/** ONE-TIME: limpar duplicados e adicionar unique constraint */
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  // Limpar duplicados
  const groups = await p.offer.groupBy({ by: ['sourceId', 'store'], _count: { sourceId: true } })
  const dups = groups.filter((g: any) => g._count.sourceId > 1 && g.sourceId)
  console.log(`Duplicados: ${dups.length} grupos`)
  let removed = 0
  for (const g of dups) {
    const rows = await p.offer.findMany({ where: { sourceId: g.sourceId, store: g.store }, orderBy: { createdAt: 'asc' } })
    for (let i = 1; i < rows.length; i++) {
      await p.priceHistory.deleteMany({ where: { offerId: rows[i].id } }).catch(() => {})
      await p.offer.delete({ where: { id: rows[i].id } }).catch(() => {})
      removed++
    }
  }
  console.log(`Removidos: ${removed}`)
  await p.$disconnect()
}
main()

/**
 * 🚀 SEED CATÁLOGO — Magalu (Magazine Você)
 * Reutiliza o scraper HTTP existente
 *
 * Uso: npx tsx prisma/seed-magalu-catalogo.ts
 */

import { PrismaClient } from '@prisma/client'
import { fetchMagaluDeals } from '../src/lib/affiliates/magalu'

const prisma = new PrismaClient()

const config = {
  mlMattTool: process.env.ML_MATT_TOOL || '35888960',
  magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',
  shopeeAppId: process.env.SHOPEE_APP_ID || '',
  shopeeSecret: process.env.SHOPEE_SECRET || '',
  amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
}

async function main() {
  console.log('🚀 SEED — Magalu\n')
  console.log('🔍 Rodando scraper (10 keywords)...')

  const deals = await fetchMagaluDeals(config)
  console.log(`   ${deals.length} ofertas encontradas`)

  let added = 0; let updated = 0

  for (const deal of deals) {
    if (!deal.sourceId || !deal.title) continue
    const existing = await prisma.offer.findFirst({
      where: { sourceId: deal.sourceId, store: deal.store },
    })
    if (existing) {
      await prisma.offer.update({
        where: { id: existing.id },
        data: { price: deal.price, originalPrice: deal.originalPrice, discountPct: deal.discountPct, imageUrl: deal.imageUrl, url: deal.url, updatedAt: new Date() },
      })
      updated++
    } else {
      await prisma.offer.create({ data: { ...deal } })
      added++
    }
  }

  const total = await prisma.offer.count({ where: { store: 'magalu' } })
  console.log(`\n📊 Magalu: ${added} novos | ${updated} atualizados | 📦 ${total} total`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) }).finally(() => prisma.$disconnect())

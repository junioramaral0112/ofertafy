/**
 * 🚀 SEED CATÁLOGO — Mercado Livre
 * Usa o scraper HTTP existente com múltiplas keywords
 *
 * Uso: npx tsx prisma/seed-ml-catalogo.ts
 */

import { PrismaClient } from '@prisma/client'
import { fetchMercadoLivreDeals } from '../src/lib/affiliates/mercadolivre'

const prisma = new PrismaClient()

const config = {
  mlMattTool: process.env.ML_MATT_TOOL || '35888960',
  magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',
  shopeeAppId: process.env.SHOPEE_APP_ID || '',
  shopeeSecret: process.env.SHOPEE_SECRET || '',
  amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
}

async function main() {
  console.log('🚀 SEED — Mercado Livre\n')

  // O scraper do ML já busca /ofertas (páginas 1 e 2) com 48 itens cada
  // Vamos rodar o scraper padrão várias vezes (ele usa cache de página)
  console.log('🔍 Rodando scraper do Mercado Livre...')
  const deals = await fetchMercadoLivreDeals(config)
  console.log(`   ${deals.length} ofertas encontradas`)

  let added = 0
  let updated = 0

  for (const deal of deals) {
    if (!deal.sourceId || !deal.title) continue

    const existing = await prisma.offer.findFirst({
      where: { sourceId: deal.sourceId, store: deal.store },
    })

    if (existing) {
      await prisma.offer.update({
        where: { id: existing.id },
        data: {
          price: deal.price,
          originalPrice: deal.originalPrice,
          discountPct: deal.discountPct,
          imageUrl: deal.imageUrl,
          url: deal.url,
          updatedAt: new Date(),
        },
      })
      updated++
    } else {
      await prisma.offer.create({ data: { ...deal } })
      added++
    }
  }

  const mlTotal = await prisma.offer.count({ where: { store: 'mercadolivre' } })
  const total = await prisma.offer.count()

  console.log(`\n📊 ML: ${added} novos | ${updated} atualizados`)
  console.log(`📦 ML total: ${mlTotal}`)
  console.log(`📦 Todas as lojas: ${total}`)
  console.log('🏁 Concluído!')
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())

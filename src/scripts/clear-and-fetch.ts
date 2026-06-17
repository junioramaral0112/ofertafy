// Limpa TODAS as ofertas do banco e re-executa os scrapers do zero
// Uso: npx tsx src/scripts/clear-and-fetch.ts

import { PrismaClient } from '@prisma/client'
import { fetchMercadoLivreDeals } from '../lib/affiliates/mercadolivre'
import { fetchMagaluDeals } from '../lib/affiliates/magalu'
import { fetchAmazonDeals } from '../lib/affiliates/amazon'
import { fetchShopeeDeals } from '../lib/affiliates/shopee'

const prisma = new PrismaClient()

const config = {
  mlMattTool: process.env.ML_MATT_TOOL || '35888960',
  magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',
  shopeeAppId: process.env.SHOPEE_APP_ID || '',
  shopeeSecret: process.env.SHOPEE_SECRET || '',
  amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
}

async function main() {
  console.log('🗑️  Limpando todas as ofertas do banco...')
  await prisma.priceHistory.deleteMany()
  await prisma.offer.deleteMany()
  console.log('✅ Banco limpo!\n')

  console.log('🔍 Buscando ofertas do zero...\n')

  const [mlDeals, magaluDeals, amazonDeals, shopeeDeals] = await Promise.all([
    fetchMercadoLivreDeals(config).catch((e) => { console.error('ML:', e.message); return [] }),
    fetchMagaluDeals(config).catch((e) => { console.error('Magalu:', e.message); return [] }),
    fetchAmazonDeals(config).catch((e) => { console.error('Amazon:', e.message); return [] }),
    fetchShopeeDeals(config).catch((e) => { console.error('Shopee:', e.message); return [] }),
  ])

  let added = 0
  for (const deal of [...mlDeals, ...magaluDeals, ...amazonDeals]) {
    if (!deal.sourceId || !deal.title) continue
    await prisma.offer.create({ data: { ...deal } })
    added++
  }

  console.log(`\n🟡 ML: ${mlDeals.length} | 🔵 Magalu: ${magaluDeals.length} | 🟠 Amazon: ${amazonDeals.length} | 🔴 Shopee: ${shopeeDeals.length}`)
  console.log(`📊 ${added} ofertas salvas com precos corrigidos!`)
  console.log('✅ Pronto! Agora todos os precos estao com sanitizePrice novo.')
}

main().catch(console.error).finally(() => prisma.$disconnect())

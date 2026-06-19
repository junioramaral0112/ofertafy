// Script standalone para buscar ofertas + cupons
// Uso: npx tsx src/scripts/fetch-offers.ts

import { PrismaClient } from '@prisma/client'
import { fetchMercadoLivreDeals } from '../lib/affiliates/mercadolivre'
import { fetchMagaluDeals } from '../lib/affiliates/magalu'
import { fetchAmazonDeals } from '../lib/affiliates/amazon'
import { fetchShopeeDeals } from '../lib/affiliates/shopee'
import { fetchTikTokDeals } from '../lib/affiliates/tiktok'
import { fetchAllCoupons, saveCoupons } from '../lib/affiliates/coupons'

const prisma = new PrismaClient()

const config = {
  mlMattTool: process.env.ML_MATT_TOOL || '35888960',
  magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',
  shopeeAppId: process.env.SHOPEE_APP_ID || '',
  shopeeSecret: process.env.SHOPEE_SECRET || '',
  tiktokAffiliateId: process.env.TIKTOK_AFFILIATE_ID || '',
  tiktokAccessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
  amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
  amazonAccessKey: process.env.AMAZON_ACCESS_KEY || '',
  amazonSecretKey: process.env.AMAZON_SECRET_KEY || '',
}

async function main() {
  console.log('🔍 Buscando ofertas...')
  console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`)
  console.log('🟡 ML | 🔵 Magalu | 🟠 Amazon | 🔴 Shopee | 🎵 TikTok')
  console.log('')

  const [mlDeals, magaluDeals, amazonDeals, shopeeDeals, tiktokDeals] = await Promise.all([
    fetchMercadoLivreDeals(config).catch((e) => { console.error('ML:', e.message); return [] }),
    fetchMagaluDeals(config).catch((e) => { console.error('Magalu:', e.message); return [] }),
    fetchAmazonDeals(config).catch((e) => { console.error('Amazon:', e.message); return [] }),
    fetchShopeeDeals(config).catch((e) => { console.error('Shopee:', e.message); return [] }),
    fetchTikTokDeals(config).catch((e) => { console.error('TikTok:', e.message); return [] }),
  ])

  let added = 0, updated = 0
  const allDeals = [...mlDeals, ...magaluDeals, ...shopeeDeals, ...amazonDeals, ...tiktokDeals]

  for (const deal of allDeals) {
    if (!deal.sourceId || !deal.title) continue
    const existing = await prisma.offer.findFirst({
      where: { sourceId: deal.sourceId, store: deal.store },
    })
    if (existing) {
      if (existing.price !== deal.price) {
        await prisma.priceHistory.create({ data: { offerId: existing.id, price: deal.price } })
      }
      await prisma.offer.update({
        where: { id: existing.id },
        data: { price: deal.price, originalPrice: deal.originalPrice, discountPct: deal.discountPct, imageUrl: deal.imageUrl, url: deal.url, freeShipping: deal.freeShipping, installment: deal.installment, updatedAt: new Date() },
      })
      updated++
    } else {
      await prisma.offer.create({ data: { ...deal } })
      added++
    }
  }

  console.log(`🟡 ML: ${mlDeals.length} | 🔵 Magalu: ${magaluDeals.length} | 🟠 Amazon: ${amazonDeals.length} | 🔴 Shopee: ${shopeeDeals.length} | 🎵 TikTok: ${tiktokDeals.length}`)
  console.log(`📊 ${added} novas ofertas, ${updated} atualizadas`)

  // ── Cupons de desconto ────────────────────────────────
  console.log('')
  console.log('🎫 Buscando cupons de desconto...')
  try {
    const coupons = await fetchAllCoupons(config)
    const result = await saveCoupons(coupons)
    console.log(`🎫 Cupons: ${result.added} novos, ${result.updated} atualizados`)
  } catch (e: any) {
    console.error('🎫 Erro nos cupons:', e.message?.slice(0, 120))
  }

  console.log('✅ ML (matt_tool) | Magalu | Amazon (tag) | Shopee (affiliate_id)')
}

main().catch(console.error).finally(() => prisma.$disconnect())

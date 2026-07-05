// Script standalone para buscar ofertas + cupons
// Uso: npx tsx src/scripts/fetch-offers.ts

import { PrismaClient } from '@prisma/client'
import { fetchMercadoLivreDeals } from '../lib/affiliates/mercadolivre'
import { fetchMagaluDeals } from '../lib/affiliates/magalu'
import { fetchAmazonDeals } from '../lib/affiliates/amazon'
import { fetchShopeeDeals } from '../lib/affiliates/shopee'
import { fetchTikTokDeals } from '../lib/affiliates/tiktok'
import { fetchAllCoupons, saveCoupons } from '../lib/affiliates/coupons'
import { classifyProduct } from '../lib/utils'

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

// ═══════════════════════════════════════════════════════════
// Constantes de resiliência
// ═══════════════════════════════════════════════════════════
const BATCH_SIZE = 50          // ofertas por lote no createMany
const BATCH_DELAY_MS = 300     // pausa entre lotes
const MAX_RETRIES = 3          // tentativas por lote
const RETRY_DELAY_MS = 1000    // pausa extra quando falha

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Constrói chave única para o Map de existência */
function offerKey(sourceId: string, store: string): string {
  return `${store}::${sourceId}`
}

/**
 * Salva ofertas em bulk:
 *   1. 1 query findMany → Map em memória
 *   2. Separa novos vs existentes
 *   3. createMany para novos (batch de 50)
 *   4. Updates individuais em lote (só atualiza quem mudou preço)
 */
async function saveOffersBulk(allDeals: any[]): Promise<{ added: number; updated: number; errors: number }> {
  const validDeals = allDeals.filter((d) => d.sourceId && d.title && d.price > 0)
  if (validDeals.length === 0) return { added: 0, updated: 0, errors: 0 }

  console.log(`\n💾 Salvando ${validDeals.length} ofertas (bulk)...`)

  // ── UPSERT: imune a duplicados (unique constraint sourceId+store) ──
  let added = 0, updated = 0, errors = 0

  for (let i = 0; i < validDeals.length; i++) {
    const deal = validDeals[i]
    const catResult = classifyProduct(deal.title, deal.price, deal.category)

    try {
      const existing = await prisma.offer.findFirst({
        where: { sourceId: deal.sourceId, store: deal.store },
        select: { id: true, price: true },
      })

      if (existing) {
        if (existing.price !== deal.price) {
          await prisma.priceHistory.create({ data: { offerId: existing.id, price: deal.price } })
        }
        await prisma.offer.update({
          where: { id: existing.id },
          data: {
            price: deal.price, originalPrice: deal.originalPrice, discountPct: deal.discountPct,
            imageUrl: deal.imageUrl, url: deal.url, freeShipping: deal.freeShipping,
            installment: deal.installment, updatedAt: new Date(),
            category: catResult.category, categorySlug: catResult.categorySlug,
            scorePromocional: deal.scorePromocional ?? 0,
          },
        })
        updated++
      } else {
        await prisma.offer.create({
          data: {
            ...deal,
            category: catResult.category, categorySlug: catResult.categorySlug,
            scorePromocional: deal.scorePromocional ?? 0,
          },
        })
        added++
      }
    } catch (e: any) {
      errors++
    }
    if (i > 0 && i % 100 === 0) {
      process.stdout.write(`   ${i}/${validDeals.length} (${added} novas, ${updated} att)\r`)
      await sleep(50)
    }
  }

  // ── 4. Updates em lote ─────────────────────────────────
  for (const { id, deal, catResult, oldPrice } of paraAtualizar) {
    try {
      await prisma.priceHistory.create({ data: { offerId: id, price: deal.price } })
      await prisma.offer.update({
        where: { id },
        data: {
          price: deal.price,
          originalPrice: deal.originalPrice,
          discountPct: deal.discountPct,
          imageUrl: deal.imageUrl,
          url: deal.url,
          freeShipping: deal.freeShipping,
          installment: deal.installment,
          category: catResult.category,
          categorySlug: catResult.categorySlug,
          scorePromocional: deal.scorePromocional ?? 0,
          updatedAt: new Date(),
        },
      })
      updated++
    } catch (e: any) {
      errors++
    }
  }

  return { added, updated, errors }
}

async function main() {
  console.log('🔍 Buscando ofertas...')
  console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`)
  console.log('🟡 ML | 🔵 Magalu | 🟠 Amazon | 🔴 Shopee | 🎵 TikTok')
  console.log('')

  // ── Fase 1: Captura (paralelo, igual antes) ──────────
  const [mlDeals, magaluDeals, amazonDeals, shopeeDeals, tiktokDeals] = await Promise.all([
    fetchMercadoLivreDeals(config).catch((e) => { console.error('ML:', e.message); return [] }),
    fetchMagaluDeals(config).catch((e) => { console.error('Magalu:', e.message); return [] }),
    fetchAmazonDeals(config).catch((e) => { console.error('Amazon:', e.message); return [] }),
    fetchShopeeDeals(config).catch((e) => { console.error('Shopee:', e.message); return [] }),
    fetchTikTokDeals(config).catch((e) => { console.error('TikTok:', e.message); return [] }),
  ])

  console.log(`🟡 ML: ${mlDeals.length} | 🔵 Magalu: ${magaluDeals.length} | 🟠 Amazon: ${amazonDeals.length} | 🔴 Shopee: ${shopeeDeals.length} | 🎵 TikTok: ${tiktokDeals.length}`)

  // ── Fase 2: Dedup + Salvamento Bulk ──────────────────
  const allRaw = [...mlDeals, ...magaluDeals, ...shopeeDeals, ...amazonDeals, ...tiktokDeals]
  const seen = new Set<string>()
  const allDeals = allRaw.filter((d: any) => {
    const key = `${d.sourceId || ''}-${d.store}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const { added, updated, errors } = await saveOffersBulk(allDeals)

  console.log(`\n📊 Final: ${added} novas, ${updated} atualizadas, ${errors} erros`)

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

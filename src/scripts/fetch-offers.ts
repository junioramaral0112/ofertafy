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

  // ── 1. Carregar existentes em 1 query ──────────────────
  const keys = validDeals.map((d) => d.sourceId)
  const stores = [...new Set(validDeals.map((d) => d.store))]

  let existingRows: Array<{ id: string; sourceId: string | null; store: string; price: number; scorePromocional: number }> = []
  try {
    existingRows = await prisma.offer.findMany({
      where: { sourceId: { in: keys }, store: { in: stores } },
      select: { id: true, sourceId: true, store: true, price: true, scorePromocional: true },
    })
  } catch (e: any) {
    console.error(`   ❌ Erro ao carregar existentes: ${e.message?.slice(0, 100)}`)
    // fallback: continua sem mapa (tudo será create)
  }

  // Map: `${store}::${sourceId}` → { id, price, scorePromocional }
  const existMap = new Map<string, typeof existingRows[0]>()
  for (const row of existingRows) {
    if (row.sourceId) existMap.set(offerKey(row.sourceId, row.store), row)
  }
  console.log(`   📊 ${existingRows.length} já existem no banco | ${validDeals.length - existingRows.length} novos`)

  // ── 2. Separar novos vs existentes ─────────────────────
  const novos: any[] = []
  const paraAtualizar: Array<{ id: string; deal: any; catResult: any; oldPrice: number; oldScore: number }> = []

  for (const deal of validDeals) {
    const key = offerKey(deal.sourceId, deal.store)
    const existing = existMap.get(key)
    const catResult = classifyProduct(deal.title, deal.price, deal.category)

    if (existing) {
      if (existing.price !== deal.price) {
        paraAtualizar.push({
          id: existing.id,
          deal,
          catResult,
          oldPrice: existing.price,
          oldScore: existing.scorePromocional,
        })
      }
    } else {
      novos.push({
        ...deal,
        category: catResult.category,
        categorySlug: catResult.categorySlug,
        scorePromocional: deal.scorePromocional ?? 0,
      })
    }
  }

  let added = 0, updated = 0, errors = 0

  // ── 3. Criar um por um (mais confiável que createMany) ──
  for (let i = 0; i < novos.length; i++) {
    try {
      await prisma.offer.create({ data: novos[i] })
      added++
    } catch (e: any) {
      // Tentar sem os campos problemáticos
      try {
        const { scorePromocional, ...safe } = novos[i]
        await prisma.offer.create({ data: safe })
        added++
      } catch {
        errors++
      }
    }
    if (i > 0 && i % 50 === 0) {
      process.stdout.write(`   ${i}/${novos.length}\r`)
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

  // ── Fase 2: Salvamento Bulk ───────────────────────────
  const allDeals = [...mlDeals, ...magaluDeals, ...shopeeDeals, ...amazonDeals, ...tiktokDeals]
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

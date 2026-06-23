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
const BATCH_SIZE = 10          // ofertas por lote
const BATCH_DELAY_MS = 400     // pausa entre lotes
const MAX_RETRIES = 2          // tentativas por oferta
const RETRY_DELAY_MS = 800     // pausa extra quando falha

/** Pausa assíncrona */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Salva/atualiza UMA oferta com retry e tratamento de erro */
async function saveOneOffer(
  deal: any,
  retries: number = MAX_RETRIES,
): Promise<'added' | 'updated' | 'skipped' | 'error'> {
  try {
    const catResult = classifyProduct(deal.title, deal.price, deal.category)

    const existing = await prisma.offer.findFirst({
      where: { sourceId: deal.sourceId, store: deal.store },
      select: { id: true, price: true, scorePromocional: true },
    })

    if (existing) {
      if (existing.price !== deal.price) {
        await prisma.priceHistory.create({
          data: { offerId: existing.id, price: deal.price },
        })
      }
      await prisma.offer.update({
        where: { id: existing.id },
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
          scorePromocional: deal.scorePromocional ?? existing.scorePromocional ?? 0,
          updatedAt: new Date(),
        },
      })
      return 'updated'
    } else {
      await prisma.offer.create({
        data: {
          ...deal,
          category: catResult.category,
          categorySlug: catResult.categorySlug,
          scorePromocional: deal.scorePromocional ?? 0,
        },
      })
      return 'added'
    }
  } catch (e: any) {
    // Erro de conexão (P1017) ou timeout → retry
    const isConnectionError =
      e?.code === 'P1017' ||
      e?.message?.includes('Server has closed') ||
      e?.message?.includes('timeout') ||
      e?.message?.includes('ECONNREFUSED')

    if (isConnectionError && retries > 0) {
      console.warn(`   ⚠️  Conexão caiu em "${deal.title?.slice(0, 40)}"... retry em ${RETRY_DELAY_MS}ms (${retries} restantes)`)
      await sleep(RETRY_DELAY_MS)
      return saveOneOffer(deal, retries - 1)
    }

    console.error(`   ❌ Erro persistente em "${deal.title?.slice(0, 40)}": ${e.message?.slice(0, 80)}`)
    return 'error'
  }
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
  console.log('')

  // ── Fase 2: Salvamento em Lotes ──────────────────────
  const allDeals = [...mlDeals, ...magaluDeals, ...shopeeDeals, ...amazonDeals, ...tiktokDeals]
    .filter((d) => d.sourceId && d.title)

  let added = 0, updated = 0, skipped = 0, errors = 0
  const totalBatches = Math.ceil(allDeals.length / BATCH_SIZE)

  console.log(`💾 Salvando ${allDeals.length} ofertas em ${totalBatches} lotes de ${BATCH_SIZE}...`)
  console.log('')

  for (let i = 0; i < allDeals.length; i += BATCH_SIZE) {
    const batch = allDeals.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    // Processa o lote (sequencialmente dentro do lote para não sobrecarregar)
    for (const deal of batch) {
      const result = await saveOneOffer(deal)

      if (result === 'added') added++
      else if (result === 'updated') updated++
      else if (result === 'skipped') skipped++
      else errors++
    }

    // Progresso
    const done = Math.min(i + BATCH_SIZE, allDeals.length)
    const pct = Math.round((done / allDeals.length) * 100)
    process.stdout.write(`\r   📊 ${done}/${allDeals.length} (${pct}%) — ${added} novas, ${updated} atualizadas, ${errors} erros`)

    // Pausa entre lotes (só se ainda houver mais)
    if (i + BATCH_SIZE < allDeals.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  console.log('')
  console.log('')
  console.log(`📊 Final: ${added} novas, ${updated} atualizadas, ${skipped} ignoradas, ${errors} erros`)

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

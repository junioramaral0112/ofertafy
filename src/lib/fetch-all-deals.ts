/**
 * 🔒 ISOLADO: fetchAllDeals — NUNCA importado por páginas.
 *
 * Motivo: contém import dinâmico do módulo Amazon (Puppeteer).
 * Se fosse importado por qualquer página, o bundler do Next.js
 * empacotaria o Puppeteer nos serverless functions da Vercel
 * e quebraria o deploy com MODULE_NOT_FOUND.
 *
 * Quem usa: apenas /api/fetch/route.ts e scripts standalone.
 */

import { prisma } from './prisma'
import { invalidateCache } from './cache'
import { fetchMercadoLivreDeals } from './affiliates/mercadolivre'
import { fetchMagaluDeals } from './affiliates/magalu'
import { fetchShopeeDeals } from './affiliates/shopee'
import { fetchTikTokDeals } from './affiliates/tiktok'
import { fetchSheinDeals } from './affiliates/shein'
import type { FetchResult } from '@/types'

function getAffiliateConfig() {
  return {
    mlMattTool: process.env.ML_MATT_TOOL || '35888960',
    magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',

    // Shopee API oficial
    shopeeAppId: process.env.SHOPEE_APP_ID || '',
    shopeeSecret: process.env.SHOPEE_SECRET || '',

    // TikTok Shop
    tiktokAffiliateId: process.env.TIKTOK_AFFILIATE_ID || '',
    tiktokAccessToken: process.env.TIKTOK_ACCESS_TOKEN || '',

    // Amazon
    amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || '',
    amazonAccessKey: process.env.AMAZON_ACCESS_KEY || '',
    amazonSecretKey: process.env.AMAZON_SECRET_KEY || '',
  }
}

export async function fetchAllDeals(): Promise<FetchResult[]> {
  const config = getAffiliateConfig()
  const results: FetchResult[] = []

  // Lojas leves (sem Puppeteer)
  const [mlDeals, magaluDeals, shopeeDeals, tiktokDeals, sheinDeals] = await Promise.all([
    fetchMercadoLivreDeals(config).catch((e) => { console.error('ML:', e); return [] }),
    fetchMagaluDeals(config).catch((e) => { console.error('Magalu:', e); return [] }),
    fetchShopeeDeals(config).catch((e) => { console.error('Shopee:', e); return [] }),
    fetchTikTokDeals(config).catch((e) => { console.error('TikTok:', e); return [] }),
    // SHEIN leve (fetch-based) — fallback rápido
    fetchSheinDeals(config).catch((e) => { console.error('SHEIN:', e); return [] }),
  ])

  // Amazon — Puppeteer (import dinâmico ISOLADO)
  let amazonDeals: any[] = []
  if (config.amazonAssociateTag || process.env.AMAZON_ASSOCIATE_TAG) {
    try {
      const { fetchAmazonDeals } = await import('./affiliates/amazon')
      amazonDeals = await fetchAmazonDeals(config).catch((e: any) => {
        console.error('Amazon:', e.message?.slice(0, 120))
        return []
      })
    } catch (e: any) {
      console.error('Amazon (import):', e.message?.slice(0, 120))
    }
  }

  // Processar e salvar no banco
  const processStore = async (
    deals: typeof mlDeals,
    storeLabel: string
  ): Promise<FetchResult> => {
    let added = 0
    let updated = 0
    const errors: string[] = []

    for (const deal of deals) {
      try {
        if (!deal.sourceId || !deal.title) {
          errors.push(`Oferta invalida: ${JSON.stringify(deal).slice(0, 100)}`)
          continue
        }

        const existing = await prisma.offer.findFirst({
          where: { sourceId: deal.sourceId, store: deal.store },
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
              updatedAt: new Date(),
            },
          })
          updated++
        } else {
          await prisma.offer.create({ data: { ...deal } })
          added++
        }
      } catch (error) {
        errors.push(`Erro ao processar ${deal.title}: ${String(error)}`)
      }
    }

    invalidateCache('offers')
    invalidateCache('home')

    return { store: storeLabel, offersFound: deals.length, offersAdded: added, offersUpdated: updated, errors: errors.slice(0, 5) }
  }

  const [mlResult, magaluResult, shopeeResult, tiktokResult, sheinResult] = await Promise.all([
    processStore(mlDeals, 'Mercado Livre'),
    processStore(magaluDeals, 'Magalu'),
    processStore(shopeeDeals, 'Shopee'),
    processStore(tiktokDeals, 'TikTok Shop'),
    processStore(sheinDeals, 'SHEIN'),
  ])

  results.push(mlResult, magaluResult, shopeeResult, tiktokResult, sheinResult)

  // Amazon — processa separadamente
  if (amazonDeals.length > 0) {
    results.push(await processStore(amazonDeals, 'Amazon'))
  }

  return results
}

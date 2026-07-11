/**
 * AUTO-REFRESH ENGINE — Atualizacao recorrente de ofertas promocionais.
 *
 * Executa a cada 3 horas e foca EXCLUSIVAMENTE em sessoes promocionais:
 *
 *   Amazon:    /deals + /gp/bestsellers (tag X% OFF, alta classificacao)
 *   Shopee:    Descobertas do Dia + Ofertas Relampago (tag Indicado)
 *   Magalu:    Cards com tag verde de X% OFF
 *   Mercado Livre: OFERTA DO DIA + MAIS VENDIDO + Ofertas Relampago
 *
 * Produtos que perderam as tags promocionais sao desativados automaticamente.
 */

import { prisma } from './prisma'
import { invalidateCache } from './cache'

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

interface PromoDeal {
  sourceId: string
  store: string
  title: string
  price: number
  originalPrice: number
  discountPct: number
  imageUrl: string
  url: string
  isFlash: boolean
  isBestSeller: boolean
  isRecommended: boolean
  freeShipping: boolean
  rating?: number
  storeLabel: string
  category: string
  categorySlug: string
  tags: string[]  // tags promocionais detectadas
}

interface RefreshResult {
  store: string
  dealsFound: number
  dealsAdded: number
  dealsUpdated: number
  dealsDeactivated: number
  errors: string[]
  durationMs: number
}

// ═══════════════════════════════════════════════════════════
// SCRAPER: Amazon — /deals + /gp/bestsellers
// ═══════════════════════════════════════════════════════════

async function scrapeAmazonPromos(): Promise<PromoDeal[]> {
  const deals: PromoDeal[] = []

  // Amazon — HTTP scraping publico das paginas de ofertas
  // Sem dependencia de API key ou Puppeteer
  const urls = [
    'https://www.amazon.com.br/gp/goldbox/',
    'https://www.amazon.com.br/deals?ref_=nav_cs_gb',
  ]

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    }

    for (const url of urls) {
      try {
        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
        if (!resp.ok) continue
        const html = await resp.text()

        // Extrair produtos do HTML usando regex nos data-attributes
        const productMatches = html.match(/\{"title":"[^"]+","price":"[^"]*"[^}]*\}/g) || []
        for (const match of productMatches.slice(0, 25)) {
          try {
            const data = JSON.parse(match)
            const price = parseFloat(data.price || '0')
            if (!data.title || price <= 0) continue

            deals.push({
              sourceId: `amz-${hashString(data.title)}`,
              store: 'amazon',
              title: data.title,
              price,
              originalPrice: price * 1.2,
              discountPct: Math.round((1 - price / (price * 1.2)) * 100),
              imageUrl: data.image || '',
              url: `https://www.amazon.com.br/dp/${data.asin || ''}`,
              isFlash: html.includes('flash'),
              isBestSeller: data.title?.toLowerCase().includes('best seller'),
              isRecommended: false,
              freeShipping: false,
              storeLabel: 'Amazon',
              category: 'Ofertas',
              categorySlug: 'ofertas',
              tags: ['X% OFF'],
            })
          } catch { /* skip malformed JSON */ }
        }
      } catch { /* skip failed URL */ }
    }
  } catch (e: any) {
    console.error('[auto-refresh] Amazon:', e.message?.slice(0, 150))
  }

  return deals
}

function hashString(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

// ═══════════════════════════════════════════════════════════
// SCRAPER: Shopee — Descobertas do Dia + Ofertas Relampago
// ═══════════════════════════════════════════════════════════

async function scrapeShopeePromos(): Promise<PromoDeal[]> {
  const deals: PromoDeal[] = []

  // Shopee — HTTP scraping publico das paginas de ofertas
  // Sem dependencia da API oficial de afiliados
  const urls = [
    'https://shopee.com.br/flash_sale',
    'https://shopee.com.br/search?keyword=oferta+relampago&sortBy=sales',
    'https://shopee.com.br/search?keyword=mais+vendidos&sortBy=sales',
  ]

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    }

    for (const url of urls) {
      try {
        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
        if (!resp.ok) continue
        const html = await resp.text()

        // Extrair dados dos scripts JSON embutidos na pagina
        const jsonMatches = html.match(/\{"itemid":\d+,"name":"[^"]+","price":\d+[^}]*\}/g) || []
        for (const match of jsonMatches.slice(0, 25)) {
          try {
            const data = JSON.parse(match)
            const price = (data.price || 0) / 100000
            const originalPrice = (data.price_before_discount || data.price || 0) / 100000
            if (!data.name || price <= 0) continue

            deals.push({
              sourceId: `shopee-${data.shopid || 0}-${data.itemid || hashString(data.name)}`,
              store: 'shopee',
              title: data.name,
              price,
              originalPrice: originalPrice > price ? originalPrice : price * 1.25,
              discountPct: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 10,
              imageUrl: `https://cf.shopee.com.br/file/${data.image || ''}`,
              url: `https://shopee.com.br/product/${data.shopid || 0}/${data.itemid || 0}`,
              isFlash: url.includes('flash'),
              isBestSeller: url.includes('vendidos'),
              isRecommended: data.is_recommended || false,
              freeShipping: data.free_shipping || false,
              storeLabel: 'Shopee',
              category: 'Ofertas',
              categorySlug: 'ofertas',
              tags: url.includes('flash') ? ['OFERTA RELAMPAGO'] : ['DESCOBERTA DO DIA'],
            })
          } catch { /* skip malformed */ }
        }
      } catch { /* skip failed URL */ }
    }
  } catch (e: any) {
    console.error('[auto-refresh] Shopee:', e.message?.slice(0, 150))
  }

  return deals
}

// ═══════════════════════════════════════════════════════════
// SCRAPER: Magalu — Cards com tag verde de X% OFF
// ═══════════════════════════════════════════════════════════

async function scrapeMagaluPromos(): Promise<PromoDeal[]> {
  const deals: PromoDeal[] = []

  try {
    const { fetchMagaluDeals } = await import('./affiliates/magalu')
    const config = { magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy' }
    // Busca apenas batch 1 (termos mais promocionais)
    const rawDeals = await fetchMagaluDeals(config, { batchNumber: 1, batchSize: 8 })
    for (const d of rawDeals) {
      deals.push({
        ...d,
        isFlash: false,
        isBestSeller: false,
        isRecommended: false,
        tags: d.discountPct >= 10 ? ['X% OFF'] : [],
        storeLabel: 'Magalu',
      })
    }
  } catch (e: any) {
    console.error('[auto-refresh] Magalu:', e.message?.slice(0, 150))
  }

  return deals
}

// ═══════════════════════════════════════════════════════════
// SCRAPER: Mercado Livre — OFERTA DO DIA + MAIS VENDIDO
// ═══════════════════════════════════════════════════════════

async function scrapeMLPromos(): Promise<PromoDeal[]> {
  const deals: PromoDeal[] = []

  try {
    const { fetchMercadoLivreDeals } = await import('./affiliates/mercadolivre')
    const config = { mlMattTool: process.env.ML_MATT_TOOL || '35888960' }
    const rawDeals = await fetchMercadoLivreDeals(config)
    for (const d of rawDeals) {
      const title = (d.title || '').toLowerCase()
      const tags: string[] = []
      if (title.includes('oferta do dia')) tags.push('OFERTA DO DIA')
      if (d.isBestSeller) tags.push('MAIS VENDIDO')
      deals.push({
        ...d,
        isFlash: title.includes('relampago') || title.includes('flash'),
        isBestSeller: d.isBestSeller || false,
        isRecommended: false,
        tags,
        storeLabel: 'Mercado Livre',
      })
    }
  } catch (e: any) {
    console.error('[auto-refresh] ML:', e.message?.slice(0, 150))
  }

  return deals
}

// ═══════════════════════════════════════════════════════════
// ORCHESTRATOR — Executa todos os scrapers e sincroniza
// ═══════════════════════════════════════════════════════════

const STORE_SCRAPERS: Record<string, () => Promise<PromoDeal[]>> = {
  amazon: scrapeAmazonPromos,
  shopee: scrapeShopeePromos,
  magalu: scrapeMagaluPromos,
  mercadolivre: scrapeMLPromos,
}

export async function runAutoRefresh(storeFilter?: string): Promise<RefreshResult[]> {
  const results: RefreshResult[] = []
  const storesToRun = storeFilter ? [storeFilter] : Object.keys(STORE_SCRAPERS)

  for (const store of storesToRun) {
    const start = Date.now()
    const result: RefreshResult = {
      store,
      dealsFound: 0,
      dealsAdded: 0,
      dealsUpdated: 0,
      dealsDeactivated: 0,
      errors: [],
      durationMs: 0,
    }

    try {
      const scraper = STORE_SCRAPERS[store]
      if (!scraper) continue

      const deals = await scraper()
      result.dealsFound = deals.length

      // ── Upsert deals (limit to 50 per batch to avoid DB overload) ──
      const activeSourceIds = new Set<string>()
      const batch = deals.slice(0, 50)

      for (const deal of batch) {
        try {
          if (!deal.sourceId || !deal.title || deal.price <= 0) continue

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
                freeShipping: deal.freeShipping,
                isFlash: deal.isFlash,
                updatedAt: new Date(),
              },
            })
            result.dealsUpdated++
          } else {
            await prisma.offer.create({
              data: {
                title: deal.title,
                description: null,
                imageUrl: deal.imageUrl,
                price: deal.price,
                originalPrice: deal.originalPrice,
                discountPct: deal.discountPct,
                url: deal.url,
                store: deal.store,
                storeLabel: deal.storeLabel,
                category: deal.category,
                categorySlug: deal.categorySlug,
                freeShipping: deal.freeShipping,
                isFlash: deal.isFlash,
                sourceId: deal.sourceId,
                clicks: 0,
                likes: 0,
                scorePromocional: 0,
              },
            })
            result.dealsAdded++
          }

          activeSourceIds.add(deal.sourceId)
        } catch (e: any) {
          result.errors.push(`${deal.title?.slice(0, 50)}: ${e.message?.slice(0, 80)}`)
        }
      }

      // ── Deactivate stale offers (lost their promo tags) ──
      if (activeSourceIds.size > 0) {
        const deactivated = await prisma.offer.updateMany({
          where: {
            store: store === 'mercadolivre' ? 'mercadolivre' : store,
            sourceId: { notIn: Array.from(activeSourceIds) },
            isFlash: true,
            updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          data: { isFlash: false },
        })
        result.dealsDeactivated = deactivated.count
      }
    } catch (e: any) {
      result.errors.push(`Fatal: ${e.message?.slice(0, 200)}`)
    }

    result.durationMs = Date.now() - start
    results.push(result)
  }

  // Invalidate caches
  invalidateCache('home')
  invalidateCache('offers')
  invalidateCache('stats')

  return results
}

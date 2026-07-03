/**
 * 👗 SHEIN SCRAPER — RapidAPI
 *
 * Fonte: Shein Scraper API (RapidAPI)
 * Base: https://shein-scraper-api.p.rapidapi.com
 *
 * Diferente do scraping HTML, esta API retorna JSON estruturado
 * com paginação real, permitindo coletar 60-80+ produtos por categoria.
 */

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
}

interface SearchConfig {
  term: string; category: string; categorySlug: string; pages: number
}

interface RapidApiProduct {
  goods_id?: string
  goods_name?: string
  goods_img?: string
  sale_price?: number
  original_price?: number
  score?: number
}

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════

const RAPIDAPI_BASE = 'https://shein-scraper-api.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const RAPIDAPI_HOST = 'shein-scraper-api.p.rapidapi.com'

function rapidApiHeaders(): Record<string, string> {
  return {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'Content-Type': 'application/json',
  }
}

const SEARCH_CONFIGS: SearchConfig[] = [
  // ── MODA FEMININA ──────────────────────────
  { term: 'vestido', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 4 },
  { term: 'blusa feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 4 },
  { term: 'conjunto feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 3 },
  { term: 'saia', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 3 },
  { term: 'calca feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 3 },

  // ── MODA MASCULINA ─────────────────────────
  { term: 'camiseta masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 4 },
  { term: 'camisa masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 4 },
  { term: 'calca masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 3 },
  { term: 'bermuda masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 3 },
  { term: 'camisa social masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 3 },
  { term: 'moletom masculino', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 3 },

  // ── CALÇADOS ───────────────────────────────
  { term: 'tenis feminino', category: 'Calçados', categorySlug: 'calcados', pages: 4 },
  { term: 'tenis masculino', category: 'Calçados', categorySlug: 'calcados', pages: 4 },
  { term: 'sandalia feminina', category: 'Calçados', categorySlug: 'calcados', pages: 3 },
  { term: 'bota feminina', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'chinelo', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'sapato social', category: 'Calçados', categorySlug: 'calcados', pages: 2 },

  // ── BOLSAS ─────────────────────────────────
  { term: 'bolsa feminina', category: 'Bolsas', categorySlug: 'bolsas', pages: 3 },
  { term: 'bolsa tiracolo', category: 'Bolsas', categorySlug: 'bolsas', pages: 3 },
  { term: 'mochila', category: 'Bolsas', categorySlug: 'bolsas', pages: 3 },
  { term: 'carteira feminina', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },

  // ── INFANTIL ───────────────────────────────
  { term: 'roupa infantil', category: 'Infantil', categorySlug: 'infantil', pages: 3 },
  { term: 'vestido infantil', category: 'Infantil', categorySlug: 'infantil', pages: 3 },
  { term: 'conjunto bebe', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'calcado infantil', category: 'Infantil', categorySlug: 'infantil', pages: 2 },

  // ── BELEZA ─────────────────────────────────
  { term: 'maquiagem', category: 'Beleza', categorySlug: 'beleza', pages: 3 },
  { term: 'batom', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'perfume', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'skincare', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
]

const RATE_LIMIT_MS = 700

// ═══════════════════════════════════════════════════════════
// FETCH PRINCIPAL
// ═══════════════════════════════════════════════════════════

export async function fetchSheinDeals(config: AffiliateConfig): Promise<RawOffer[]> {
  console.log('👗 SHEIN RapidAPI: iniciando...')
  console.log(`   ${SEARCH_CONFIGS.length} termos, até 4 páginas cada`)

  if (!RAPIDAPI_KEY) {
    console.error('❌ RAPIDAPI_KEY não configurada no .env')
    return []
  }

  const all: RawOffer[] = []
  const seen = new Set<string>()

  for (let i = 0; i < SEARCH_CONFIGS.length; i++) {
    const cfg = SEARCH_CONFIGS[i]
    let termTotal = 0

    for (let page = 1; page <= cfg.pages; page++) {
      try {
        const products = await searchProducts(cfg.term, page)

        for (const p of products) {
          const offer = buildOffer(p, cfg)
          if (offer && !seen.has(offer.sourceId)) {
            seen.add(offer.sourceId)
            all.push(offer)
            termTotal++
          }
        }

        // Se não retornou nada nesta página, para de paginar
        if (products.length === 0) break

        await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
      } catch (e: any) {
        if (page === 1) console.error(`   ❌ ${cfg.term}: ${e.message?.slice(0, 60)}`)
        break
      }
    }

    console.log(`   ${i + 1}/${SEARCH_CONFIGS.length} ${cfg.term}: ${termTotal} ofertas (total: ${all.length})`)
  }

  console.log(`👗 SHEIN total: ${all.length} ofertas`)
  return all
}

// ═══════════════════════════════════════════════════════════
// CHAMADA À API
// ═══════════════════════════════════════════════════════════

async function searchProducts(keyword: string, page: number): Promise<RapidApiProduct[]> {
  const url = `${RAPIDAPI_BASE}/shein/product/search?keyword=${encodeURIComponent(keyword)}&page=${page}&country=BR`

  const res = await fetch(url, {
    method: 'GET',
    headers: rapidApiHeaders(),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit excedido')
    throw new Error(`HTTP ${res.status}`)
  }

  const data = await res.json()

  // A API pode retornar { products: [...] } ou array direto
  const products = data?.products || data?.data?.products || data || []
  return Array.isArray(products) ? products : []
}

// ═══════════════════════════════════════════════════════════
// CONSTRUÇÃO DA OFERTA
// ═══════════════════════════════════════════════════════════

function buildOffer(product: RapidApiProduct, cfg: SearchConfig): RawOffer | null {
  try {
    const id = product.goods_id || ''
    const title = (product.goods_name || '').trim()

    if (!id || !title || title.length < 3) return null

    const price = Number(product.sale_price || 0)
    if (price <= 0) return null

    const originalPrice = Number(product.original_price || 0) || Math.round(price * 1.4 * 100) / 100
    const finalPrice = sanitizePrice(String(price))
    if (finalPrice <= 0) return null

    const finalOrig = sanitizePrice(String(originalPrice))
    const discountPct = finalOrig > finalPrice
      ? Math.round(((finalOrig - finalPrice) / finalOrig) * 100)
      : 0

    const imageUrl = product.goods_img
      ? product.goods_img.startsWith('http') ? product.goods_img : `https:${product.goods_img}`
      : `https://picsum.photos/seed/shein-${id}/400/400`

    return {
      sourceId: `shein-${id}`,
      title: title.slice(0, 250),
      description: null,
      imageUrl,
      price: finalPrice,
      originalPrice: finalOrig,
      discountPct,
      url: `https://br.shein.com/product-p-${id}.html`,
      store: 'shein',
      storeLabel: 'SHEIN',
      category: cfg.category,
      categorySlug: cfg.categorySlug,
      installment: finalPrice > 40 ? `3x R$ ${(finalPrice / 3).toFixed(2)}` : null,
      freeShipping: finalPrice > 50,
    }
  } catch {
    return null
  }
}

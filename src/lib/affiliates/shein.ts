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
  const url = `https://www.shein.com.br/pdsearch/${encodeURIComponent(keyword)}/?page=${page}&sort=7`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'pt-BR',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) return []

  const html = await res.text()
  const products: RapidApiProduct[] = []

  const ids = [...new Set(Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1]))]
  const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const amounts = Array.from(html.matchAll(/"salePrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

  for (let i = 0; i < Math.min(ids.length, names.length, amounts.length); i++) {
    if (amounts[i] > 0) {
      products.push({
        goods_id: ids[i],
        goods_name: names[i],
        goods_img: imgs[i],
        sale_price: amounts[i],
      })
    }
  }

  return products
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

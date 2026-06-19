/**
 * 🎵 TIKTOK SHOP — MÓDULO DE AFILIADO
 *
 * Endpoint Research API:
 *   POST https://open-api.tiktokglobalshop.com/v2/research/tts/shop/search_products
 *
 * Escopo: research.data.basic
 *
 * Link de afiliado:
 *   https://www.tiktok.com/view/product/{product_id}?u_code={TIKTOK_AFFILIATE_ID}&utm_source=copy&utm_medium=android&utm_campaign=client_share
 *
 * Fallback: Se as credenciais da API não estiverem configuradas, retorna array vazio.
 */

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface RawOffer {
  sourceId: string
  title: string
  description: string | null
  imageUrl: string
  price: number
  originalPrice: number
  discountPct: number
  url: string
  store: string
  storeLabel: string
  category: string
  categorySlug: string
  installment: string | null
  freeShipping: boolean
}

interface TikTokProduct {
  product_id?: string
  title?: string
  product_name?: string
  name?: string
  price?: {
    currency?: string
    min_price?: string | number
    max_price?: string | number
    sale_price?: string | number
    original_price?: string | number
  }
  price_info?: Array<{
    currency?: string
    sale_price?: string | number
    original_price?: string | number
  }>
  image?: string
  images?: string[]
  main_image?: string
  product_link?: string
  detail_url?: string
  shop?: {
    shop_id?: string
    shop_name?: string
  }
  sales?: number
  rating?: number
  discount_rate?: number
}

interface TikTokApiResponse {
  code?: number
  message?: string
  data?: {
    products?: TikTokProduct[]
    total_count?: number
    next_page_token?: string
  }
}

// ---------------------------------------------------------------------------
// Chamada à API
// ---------------------------------------------------------------------------

async function callTikTokApi(
  path: string,
  body: Record<string, unknown>,
  config: AffiliateConfig,
): Promise<TikTokApiResponse> {
  const accessToken = config.tiktokAccessToken || process.env.TIKTOK_ACCESS_TOKEN || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${TIKTOK_API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TikTok API HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<TikTokApiResponse>
}

// ---------------------------------------------------------------------------
// Busca de produtos
// ---------------------------------------------------------------------------

async function searchProducts(
  keyword: string,
  pageSize: number,
  config: AffiliateConfig,
): Promise<TikTokProduct[]> {
  const all: TikTokProduct[] = []

  try {
    const response = await callTikTokApi(
      '/v2/research/tts/shop/search_products',
      {
        scope: 'research.data.basic',
        keyword,
        page_size: pageSize,
        sort_by: 'sales',
        country: 'BR',
      },
      config,
    )

    if (response.code !== 0 && response.code !== undefined) {
      console.error(`   TikTok API error: [${response.code}] ${response.message || ''}`)
      return all
    }

    return response.data?.products ?? []
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    // Silencia erro de credenciais (esperado se não configurado)
    if (!msg.includes('401') && !msg.includes('403')) {
      console.error(`   TikTok API: ${msg.slice(0, 100)}`)
    }
    return all
  }
}

// ---------------------------------------------------------------------------
// Monta RawOffer a partir de um produto TikTok
// ---------------------------------------------------------------------------

function buildOffer(
  product: TikTokProduct,
  affiliateId: string,
  keyword: string,
): RawOffer | null {
  try {
    const productId = product.product_id ?? ''
    const title = (
      product.title ??
      product.product_name ??
      product.name ??
      ''
    ).trim()

    if (!productId || !title || title.length < 5) return null

    // ── Preço ──────────────────────────────────────────
    let price = 0
    let originalPrice = 0
    let discountRate = 0

    // Prioridade: price_info > price
    if (product.price_info && product.price_info.length > 0) {
      const info = product.price_info[0]
      price = Number(info.sale_price ?? 0)
      originalPrice = Number(info.original_price ?? 0)
    } else if (product.price) {
      price = Number(product.price.sale_price ?? product.price.min_price ?? 0)
      originalPrice = Number(product.price.original_price ?? product.price.max_price ?? 0)
    }

    // Desconto
    discountRate = product.discount_rate ?? 0
    if (discountRate <= 0 && originalPrice > price && price > 0) {
      discountRate = Math.round(((originalPrice - price) / originalPrice) * 100)
    }
    if (originalPrice <= price) {
      originalPrice = Math.round(price * 1.35 * 100) / 100
      discountRate = Math.round(((originalPrice - price) / originalPrice) * 100)
    }

    // ═══════════════════════════════════════════════
    // 🔒 SANITIZE PRICE
    // ═══════════════════════════════════════════════
    const finalPrice = sanitizePrice(String(price))
    const finalOriginalPrice = sanitizePrice(String(originalPrice))

    if (finalPrice <= 0 || discountRate < 10) return null

    // ── Imagem ────────────────────────────────────────
    const imgPath =
      product.image ??
      product.main_image ??
      product.images?.[0] ??
      ''
    const imageUrl = imgPath
      ? imgPath.startsWith('http')
        ? imgPath
        : `https://p16-oec-sg.ibyteimg.com/${imgPath}`
      : `https://picsum.photos/seed/tiktok-${productId}/400/400`

    // ── Categoria ─────────────────────────────────────
    const catName = keyword.charAt(0).toUpperCase() + keyword.slice(1)
    const catSlug = catName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')

    // ── Link de afiliado com u_code ───────────────────
    const affiliateUrl = buildAffiliateUrl(productId, affiliateId)

    // ── Parcelamento ──────────────────────────────────
    const installment =
      finalPrice > 40 ? `3x R$ ${(finalPrice / 3).toFixed(2)}` : null

    // ── Frete grátis ──────────────────────────────────
    const freeShipping = finalPrice > 50

    return {
      sourceId: `tiktok-${productId}`,
      title: title.slice(0, 250),
      description: null,
      imageUrl,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      discountPct: discountRate,
      url: affiliateUrl,
      store: 'tiktok',
      storeLabel: 'TikTok Shop',
      category: catName,
      categorySlug: catSlug,
      installment,
      freeShipping,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Constrói URL de afiliado TikTok
// ---------------------------------------------------------------------------

function buildAffiliateUrl(productId: string, affiliateId: string): string {
  const params = new URLSearchParams({
    u_code: affiliateId || '',
    utm_source: 'copy',
    utm_medium: 'android',
    utm_campaign: 'client_share',
  })
  return `https://www.tiktok.com/view/product/${productId}?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Ponto de entrada principal
// ---------------------------------------------------------------------------

const SEARCH_TERMS = [
  'smartphone',
  'fone bluetooth',
  'tenis',
  'perfume',
  'aspirador',
  'cafeteira',
  'relogio',
  'mochila',
]

export async function fetchTikTokDeals(config: AffiliateConfig) {
  const affiliateId = config.tiktokAffiliateId || process.env.TIKTOK_AFFILIATE_ID || ''

  if (!affiliateId) {
    console.log('🎵 TikTok Shop: TIKTOK_AFFILIATE_ID não configurado, pulando...')
    return []
  }

  console.log('🎵 TikTok Shop: iniciando busca...')

  const all: RawOffer[] = []
  const seen = new Set<string>()

  for (const term of SEARCH_TERMS) {
    try {
      const products = await searchProducts(term, 20, config)

      let count = 0
      for (const product of products) {
        const offer = buildOffer(product, affiliateId, term)
        if (offer && !seen.has(offer.sourceId)) {
          seen.add(offer.sourceId)
          all.push(offer)
          count++
        }
      }

      console.log(`   ${term}: ${count} ofertas`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`   ❌ ${term}: ${msg.slice(0, 100)}`)
    }
  }

  console.log(`🎵 TikTok Shop total: ${all.length} ofertas`)
  return all
}

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'
import crypto from 'crypto'

/**
 * 🔴 SHOPEE API OFICIAL DE AFILIADOS (GRAPHQL)
 *
 * Endpoint: https://open-api.affiliate.shopee.com.br/graphql
 *
 * Autenticação (SHA256 hash simples com payload):
 *   sig = SHA256(appId + timestamp + payload + secret)
 *   Header: Authorization: SHA256 Credential={appId}, Timestamp={ts}, Signature={sig}
 *
 * Query: productOfferV2
 *   - keyword: termo de busca (String, singular)
 *   - sortType: 1=Relevância 2=Vendas 3=Preço Maior→Menor 4=Preço Menor→Maior 5=Comissão
 *   - page/limit: paginação (não usa scrollId)
 *
 * Retorno: ProductOfferConnectionV2 { nodes: [ProductOfferV2], pageInfo: PageInfo }
 *   - Preços vêm como String (ex: "1899.00") → sanitizePrice
 *   - offerLink já é o link de afiliado com tracking
 */

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const GRAPHQL_ENDPOINT = 'https://open-api.affiliate.shopee.com.br/graphql'

const SEARCH_TERMS = [
  'smartphone',
  'notebook',
  'fone bluetooth',
  'tv smart',
  'geladeira',
  'aspirador',
  'cafeteira',
  'tenis',
  'perfume',
  'microfone',
]

const ITEMS_PER_PAGE = 50
const MAX_PAGES = 2

// ---------------------------------------------------------------------------
// Tipos internos
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

/** Campos reais de ProductOfferV2 (conforme schema GraphQL) */
interface ProductOfferV2Node {
  itemId?: number
  shopId?: number
  productName?: string
  shopName?: string
  price?: string
  priceMin?: string
  priceMax?: string
  priceDiscountRate?: number
  commissionRate?: string
  commission?: string
  sales?: number
  ratingStar?: string
  imageUrl?: string
  productLink?: string
  offerLink?: string
  periodStartTime?: number
  periodEndTime?: number
  productCatIds?: number
  shopType?: number
  sellerCommissionRate?: string
  shopeeCommissionRate?: string
  appExistRate?: string
  appNewRate?: string
  webExistRate?: string
  webNewRate?: string
}

interface PageInfo {
  page?: number
  limit?: number
  totalCount?: number
  hasNextPage?: boolean
}

interface ProductOfferConnectionV2 {
  nodes?: ProductOfferV2Node[] | null
  pageInfo?: PageInfo | null
}

interface GraphQLResponse {
  data?: {
    productOfferV2?: ProductOfferConnectionV2 | null
  } | null
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }> | null
}

// ---------------------------------------------------------------------------
// Assinatura (SHA256 hash simples — confirmado pelo diagnóstico)
// ---------------------------------------------------------------------------

function computeSignature(
  appId: string,
  timestamp: number,
  payload: string,
  secret: string,
): string {
  return crypto
    .createHash('sha256')
    .update(`${appId}${timestamp}${payload}${secret}`)
    .digest('hex')
}

// ---------------------------------------------------------------------------
// Chamada GraphQL
// ---------------------------------------------------------------------------

async function graphqlRequest(
  query: string,
  variables: Record<string, unknown>,
  config: AffiliateConfig,
): Promise<GraphQLResponse> {
  const appId = config.shopeeAppId!
  const secret = config.shopeeSecret!
  const timestamp = Math.floor(Date.now() / 1000)

  const body = JSON.stringify({ query, variables })
  const sig = computeSignature(appId, timestamp, body, secret)

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${sig}`,
    },
    body,
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<GraphQLResponse>
}

// ---------------------------------------------------------------------------
// Query GraphQL: productOfferV2
// ---------------------------------------------------------------------------

const OFFER_QUERY = `
query($kw: String!, $page: Int, $limit: Int, $sort: Int) {
  productOfferV2(keyword: $kw, page: $page, limit: $limit, sortType: $sort) {
    nodes {
      itemId
      shopId
      productName
      shopName
      price
      priceMin
      priceMax
      priceDiscountRate
      commissionRate
      commission
      sales
      ratingStar
      imageUrl
      productLink
      offerLink
      periodStartTime
      periodEndTime
      productCatIds
      shopType
    }
    pageInfo {
      page
      hasNextPage
    }
  }
}
`

async function fetchProductPage(
  keyword: string,
  page: number,
  sortType: number,
  config: AffiliateConfig,
): Promise<ProductOfferConnectionV2> {
  const response = await graphqlRequest(
    OFFER_QUERY,
    { kw: keyword, page, limit: ITEMS_PER_PAGE, sort: sortType },
    config,
  )

  if (response.errors?.length) {
    const msgs = response.errors.map((e) => e.message).join('; ')
    throw new Error(`GraphQL: ${msgs}`)
  }

  return response.data?.productOfferV2 ?? { nodes: [], pageInfo: null }
}

// ---------------------------------------------------------------------------
// Monta RawOffer a partir de ProductOfferV2
// ---------------------------------------------------------------------------

function buildOffer(node: ProductOfferV2Node): RawOffer | null {
  try {
    const itemId = node.itemId
    const shopId = node.shopId
    const title = (node.productName ?? '').trim()

    if (!itemId || !shopId || !title || title.length < 5) return null

    // ── Preço ──────────────────────────────────────────
    // Preços são String no schema (ex: "1899.00")
    const price = sanitizePrice(node.price)
    const priceMin = sanitizePrice(node.priceMin)
    const priceMax = sanitizePrice(node.priceMax)

    if (price <= 0) return null

    // Preço original: usa priceMax (antes do desconto) ou estima
    let originalPrice = priceMax > price ? priceMax : 0
    let discountPct = node.priceDiscountRate ?? 0

    if (discountPct <= 0 && originalPrice > price && price > 0) {
      discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
    }
    if (originalPrice <= price) {
      originalPrice = Math.round(price * 1.35 * 100) / 100
      discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
    }

    if (discountPct < 10) return null

    // ═══════════════════════════════════════════════
    // 🔒 SANITIZE PRICE (formato idêntico ao banco)
    // ═══════════════════════════════════════════════
    const finalPrice = sanitizePrice(String(price))
    const finalOriginalPrice = sanitizePrice(String(originalPrice))

    // ── Imagem ────────────────────────────────────────
    const imageUrl =
      node.imageUrl ||
      `https://picsum.photos/seed/shopee-${itemId}/400/400`

    // ── Categoria ─────────────────────────────────────
    const catName = 'Ofertas'
    const catSlug = 'ofertas'

    // ── Link de afiliado ──────────────────────────────
    // offerLink já vem com tracking da API. Fallback: productLink
    const affiliateUrl =
      node.offerLink ||
      node.productLink ||
      `https://shopee.com.br/product/${shopId}/${itemId}`

    // ── Parcelamento ──────────────────────────────────
    const installment =
      finalPrice > 50 ? `12x R$ ${(finalPrice / 12).toFixed(2)}` : null

    // ── Frete grátis ──────────────────────────────────
    const freeShipping = finalPrice > 80

    return {
      sourceId: `shopee-${shopId}-${itemId}`,
      title: title.slice(0, 250),
      description: null,
      imageUrl,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      discountPct,
      url: affiliateUrl,
      store: 'shopee',
      storeLabel: 'Shopee',
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
// Ponto de entrada principal
// ---------------------------------------------------------------------------

export async function fetchShopeeDeals(config: AffiliateConfig) {
  const appId = config.shopeeAppId || ''
  const secret = config.shopeeSecret || ''

  if (!appId || !secret) {
    console.log(
      '🔴 Shopee: credenciais (SHOPEE_APP_ID / SHOPEE_SECRET) não configuradas, pulando...',
    )
    return []
  }

  console.log('🔴 Shopee: iniciando busca via GraphQL oficial...')

  const all: RawOffer[] = []
  const seen = new Set<string>()

  // sortType=2 → Mais vendidos primeiro
  for (const term of SEARCH_TERMS) {
    try {
      let termTotal = 0
      for (let page = 0; page < MAX_PAGES; page++) {
        const connection = await fetchProductPage(term, page, 2, config)
        const nodes = connection.nodes ?? []

        if (nodes.length === 0) break

        for (const node of nodes) {
          const offer = buildOffer(node)
          if (offer && !seen.has(offer.sourceId)) {
            seen.add(offer.sourceId)
            all.push(offer)
            termTotal++
          }
        }

        // Se não tem próxima página, para
        if (!connection.pageInfo?.hasNextPage) break
      }

      console.log(`   ${term}: ${termTotal} ofertas`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`   ❌ ${term}: ${msg.slice(0, 120)}`)
    }
  }

  console.log(`🔴 Shopee total: ${all.length} ofertas`)
  return all
}

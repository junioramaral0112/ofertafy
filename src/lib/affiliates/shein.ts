/**
 * 👗 SHEIN BRASIL SCRAPER
 *
 * Extrai ofertas do site da SHEIN via fetch leve.
 * A SHEIN usa OneLink para tracking de afiliados —
 * o parâmetro url_from=affiliate_koc_4292353225 é
 * injetado apenas quando o link original não possui
 * tracking próprio.
 *
 * Estratégia de afiliado: query param 'url_from'
 * ID Afiliado: 4292353225
 */

// @ts-nocheck — regex scraping types are not statically analyzable
import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'

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

const SEARCH_TERMS = [
  'vestido',
  'blusa feminina',
  'conjunto feminino',
  'moda praia',
  'tenis feminino',
  'bolsa feminina',
  'acessorios',
  'maquiagem',
]

const AFFILIATE_PARAM = 'url_from=affiliate_koc_4292353225'

export async function fetchSheinDeals(config: AffiliateConfig): Promise<RawOffer[]> {
  console.log('👗 SHEIN: iniciando busca...')
  const all: RawOffer[] = []
  const seen = new Set<string>()

  for (const term of SEARCH_TERMS) {
    try {
      const products = await searchSheinProducts(term)
      let count = 0

      for (const p of products) {
        const offer = await buildSheinOffer(p, term)
        if (offer && !seen.has(offer.sourceId)) {
          seen.add(offer.sourceId)
          all.push(offer)
          count++
        }
      }

      console.log(`   ${term}: ${count} ofertas`)
    } catch (e: any) {
      console.error(`   ❌ ${term}: ${e.message?.slice(0, 80)}`)
    }
  }

  console.log(`👗 SHEIN total: ${all.length} ofertas`)
  return all
}

async function searchSheinProducts(keyword: string): Promise<any[]> {
  const url = `https://www.shein.com.br/pdsearch/${encodeURIComponent(keyword)}/?page=1&sort=7`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/json',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`HTTP ${res.status}`)
  }

  const html = await res.text()

  // Extrai dados do JSON-LD ou scripts inline da SHEIN
  const products: any[] = []

  // Tenta extrair do JSON inicial da página
  const jsonMatch = html.match(/<script[^>]*>\s*window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*<\/script>/)
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      const items = data?.searchResult?.productList || data?.products || []
      for (const item of items) {
        products.push({
          id: item.goods_id || item.skuId || item.id,
          title: item.goods_title || item.productName || item.title,
          price: item.salePrice || item.retailPrice,
          originalPrice: item.originalPrice || item.marketPrice,
          image: item.image || item.goods_img || item.thumbnail,
          url: `https://www.shein.com.br/${item.url_name || item.goods_id}-p-${item.goods_id}.html`,
        })
      }
    } catch { /* JSON inválido, tenta fallback */ }
  }

  // Fallback: extrai cards de produto via regex
  if (products.length === 0) {
    const cardRegex = /"goods_id"\s*:\s*"(\d+)"[\s\S]*?"goods_title"\s*:\s*"([^"]+)"[\s\S]*?"salePrice"[\s\S]*?(\d+[.\d]*)/g
    let match: RegExpExecArray | null
    while ((match = cardRegex.exec(html)) !== null) {
      const m = match
      products.push({
        id: m[1],
        title: m[2],
        price: parseFloat(m[3]) || 0,
      })
    }
  }

  // Fallback 2: links de produto
  if (products.length === 0) {
    const linkRegex = /href="(\/product-[^"]+-p-(\d+)\.html)"/g
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(html)) !== null) {
      if (match[2] && !products.find((p) => p.id === match[2])) {
        products.push({ id: match[2]!, url: `https://www.shein.com.br${match[1]}` })
      }
    }
  }

  return products.slice(0, 20)
}

async function buildSheinOffer(product: any, keyword: string): Promise<RawOffer | null> {
  try {
    const productId = String(product.id || '')
    const title = (product.title || '').trim()

    if (!productId || !title || title.length < 5) return null

    let price = Number(product.price || 0)
    let originalPrice = Number(product.originalPrice || 0)

    // Fallback se não tiver preço: estima
    if (price <= 0) return null
    if (originalPrice <= price) {
      originalPrice = Math.round(price * 1.4 * 100) / 100
    }

    const discountPct = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0

    const finalPrice = sanitizePrice(String(price))
    const finalOrig = sanitizePrice(String(originalPrice))

    if (finalPrice <= 0) return null

    // URL — preserva a original, sem injetar parâmetro manualmente
    let productUrl = product.url || `https://www.shein.com.br/product-p-${productId}.html`

    // Só adiciona tracking se não for OneLink
    if (!productUrl.includes('onelink') && !productUrl.includes('url_from=')) {
      const sep = productUrl.includes('?') ? '&' : '?'
      productUrl = `${productUrl}${sep}${AFFILIATE_PARAM}`
    }

    const imageUrl = product.image
      ? product.image.startsWith('http') ? product.image : `https://img.shein.com/${product.image}`
      : `https://picsum.photos/seed/shein-${productId}/400/400`

    const catName = keyword.charAt(0).toUpperCase() + keyword.slice(1)
    const catSlug = catName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')

    const installment = finalPrice > 40 ? `3x R$ ${(finalPrice / 3).toFixed(2)}` : null
    const freeShipping = finalPrice > 50

    return {
      sourceId: `shein-${productId}`,
      title: title.slice(0, 250),
      description: null,
      imageUrl,
      price: finalPrice,
      originalPrice: finalOrig,
      discountPct,
      url: productUrl,
      store: 'shein',
      storeLabel: 'SHEIN',
      category: catName,
      categorySlug: catSlug,
      installment,
      freeShipping,
    }
  } catch {
    return null
  }
}

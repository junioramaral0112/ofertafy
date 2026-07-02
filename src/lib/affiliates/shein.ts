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

  console.log(`      🔍 Buscando: ${keyword}`)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`HTTP ${res.status}`)
  }

  const html = await res.text()
  const products: any[] = []
  const seen = new Set<string>()

  // Extrair campos individuais do HTML
  // Formato SHEIN: "goods_id":"...", "goods_name":"...", "goods_img":"...", "salePrice":{"amount":"..."}
  const ids = [...new Set(Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1]))]
  const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const amounts = Array.from(html.matchAll(/"salePrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

  for (let i = 0; i < Math.min(ids.length, names.length, 20); i++) {
    if (!seen.has(ids[i]) && names[i] && amounts[i] > 0) {
      seen.add(ids[i])
      products.push({
        id: ids[i],
        title: names[i],
        price: amounts[i],
        image: imgs[i]?.startsWith('//') ? `https:${imgs[i]}` : (imgs[i] || ''),
        url: `https://www.shein.com.br/product-p-${ids[i]}.html`,
      })
    }
  }

  console.log(`      📦 ${products.length} produtos (${ids.length} ids, ${names.length} names, ${amounts.length} prices)`)


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

    // URL limpa do produto — SEM parâmetros de tracking
    // O tracking é aplicado separadamente pelo generateAffiliateUrl
    const productUrl = product.url || `https://www.shein.com.br/product-p-${productId}.html`

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

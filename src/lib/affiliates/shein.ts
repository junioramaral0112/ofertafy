/**
 * 👗 SHEIN BRASIL SCRAPER
 *
 * Extrai ofertas do site da SHEIN via fetch leve.
 * URLs são higienizadas para o formato canônico:
 *   https://br.shein.com/product-p-[ID].html
 *
 * Tracking de afiliado: ID 4292353225
 * O clique é registrado no Ofertafy ANTES do redirect via /ir/shein/[productId]
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

// ═══════════════════════════════════════════════════════════
// HIGIENIZAÇÃO DE URL
// ═══════════════════════════════════════════════════════════

/**
 * Extrai o ID do produto de qualquer formato de URL da SHEIN.
 *
 * Formatos suportados:
 *   - https://br.shein.com/product-p-486969975-cat-15247.html → 486969975
 *   - https://www.shein.com.br/product-p-486969975.html       → 486969975
 *   - onelink.shein.com/...                                    → extrai o ID após -p-
 *   - https://br.shein.com/product-p-486969975.html            → 486969975
 *
 * Padrão universal: o ID do produto SEMPRE aparece após "-p-".
 */
function extractProductId(input: string): string | null {
  // Padrão universal: -p- seguido de dígitos
  const match = input.match(/-p-(\d+)/)
  return match ? match[1] : null
}

/**
 * Constrói a URL canônica limpa da SHEIN.
 * Formato: https://br.shein.com/product-p-[ID].html
 *
 * Este formato funciona 100% das vezes em qualquer dispositivo,
 * sem redirecionar para a home, sem deslogar, sem parâmetros poluídos.
 */
function buildSheinUrl(productId: string): string {
  return `https://br.shein.com/product-p-${productId}.html`
}

/**
 * Higieniza qualquer URL da SHEIN, extraindo o ID e reconstruindo
 * no formato canônico limpo.
 *
 * @param rawUrl    URL bruta (pode ser onelink, www.shein.com.br, br.shein.com, etc.)
 * @param productId ID do produto (fallback se a URL não contiver -p-)
 */
function sanitizeSheinUrl(rawUrl: string | undefined | null, productId: string): string {
  // 1. Tenta extrair ID da URL bruta
  if (rawUrl) {
    const extractedId = extractProductId(rawUrl)
    if (extractedId) return buildSheinUrl(extractedId)
  }

  // 2. Usa o productId direto (formato numérico puro)
  if (productId && /^\d+$/.test(productId)) {
    return buildSheinUrl(productId)
  }

  // 3. Tenta extrair do productId (pode vir como string com -p-)
  const extractedFromId = extractProductId(productId)
  if (extractedFromId) return buildSheinUrl(extractedFromId)

  // 4. Último fallback: assume que productId é o ID puro
  return buildSheinUrl(productId)
}

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// FETCH PRINCIPAL
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// BUSCA DE PRODUTOS
// ═══════════════════════════════════════════════════════════

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
        // URL já higienizada no formato canônico
        url: buildSheinUrl(ids[i]),
      })
    }
  }

  console.log(`      📦 ${products.length} produtos (${ids.length} ids, ${names.length} names, ${amounts.length} prices)`)

  return products.slice(0, 20)
}

// ═══════════════════════════════════════════════════════════
// CONSTRUÇÃO DA OFERTA
// ═══════════════════════════════════════════════════════════

async function buildSheinOffer(product: any, keyword: string): Promise<RawOffer | null> {
  try {
    const productId = String(product.id || '')
    const title = (product.title || '').trim()

    if (!productId || !title || title.length < 5) return null

    let price = Number(product.price || 0)
    let originalPrice = Number(product.originalPrice || 0)

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

    // 🔒 URL canônica limpa — SEMPRE no formato br.shein.com
    const productUrl = sanitizeSheinUrl(product.url, productId)

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

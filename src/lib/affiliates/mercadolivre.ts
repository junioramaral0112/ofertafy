import type { AffiliateConfig } from '@/types'
import { classifyProduct, calculatePromoScore } from '@/lib/utils'
import { sanitizePricePair } from '@/lib/price-engine'
import { validateOffer, calculateEnhancedScore } from '@/lib/offer-discovery'

/**
 * 🟡 MERCADO LIVRE SCRAPER
 *
 * ⚠️ IMPORTANTE (investigação 08/2026): o endpoint /search?q= retorna 404
 * para scraper (até em navegador real nesta rede — página de erro
 * lang="es-AR") e lista.mercadolivre.com.br redireciona para
 * /gz/account-verification (detecção de bot).
 *
 * ✅ Estratégia atual: /ofertas PAGINADO (?page=1..N) — responde 200 com
 * o JSON "items":[ no SSR, ~40 ofertas por página, sem repetição entre
 * páginas. Captura selo FULL, desconto explícito, frete grátis.
 * Links com matt_tool=35888960 — sanitização robusta contra 404.
 */

const ML_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
}

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
  scorePromocional?: number
}

const ML_OFFERS_PAGES = 12 // páginas por crawl (~40 ofertas cada, cabe no maxDuration 60s)
const ML_OFFERS_DELAY_MS = 300

export async function fetchMercadoLivreDeals(config: AffiliateConfig) {
  const all: RawOffer[] = []
  const seen = new Set<string>()
  const mattTool = config.mlMattTool || '35888960'

  console.log(`🟡 ML: buscando /ofertas paginado (${ML_OFFERS_PAGES} páginas) — /search?q= bloqueado`)

  for (let page = 1; page <= ML_OFFERS_PAGES; page++) {
    try {
      const url = `https://www.mercadolivre.com.br/ofertas?page=${page}`
      const res = await fetch(url, { headers: ML_HEADERS, signal: AbortSignal.timeout(15000) })

      if (!res.ok) {
        if (page === 1) console.log(`   ⚠️ /ofertas HTTP ${res.status} — abortando crawl ML`)
        break
      }

      const html = await res.text()
      const offers = extractMLItems(html, mattTool)

      let count = 0
      for (const o of offers) {
        if (!seen.has(o.sourceId)) {
          const validation = validateOffer(o)
          if (!validation.valid) continue
          seen.add(o.sourceId)
          all.push(o)
          count++
        }
      }

      if (count === 0) break // fim da paginação ou página repetida
      console.log(`   página ${page}: ${count} ofertas novas (total ${all.length})`)
    } catch (e: any) {
      // Silencioso — continua próxima página
    }
    await new Promise(r => setTimeout(r, ML_OFFERS_DELAY_MS))
  }

  console.log(`🟡 ML total: ${all.length} ofertas (${seen.size} únicas)`)
  return all
}

export function extractMLItems(html: string, mattTool: string): RawOffer[] {
  const offers: RawOffer[] = []
  const seen = new Set<string>()

  // ML pode ter vários arrays "items":[ no HTML (banners, carrosséis,
  // produtos...). Varre TODOS e extrai dos que contêm produtos MLB reais
  // (parseItem descarta os que não têm metadata.id MLB).
  const marker = '"items":['
  let searchFrom = 0

  while ((searchFrom = html.indexOf(marker, searchFrom)) !== -1) {
    try {
      const arrayStart = searchFrom + marker.length - 1 // posição do '['

      // Balancear colchetes
      let depth = 0, pos = arrayStart
      while (pos < html.length) {
        if (html[pos] === '[') depth++
        else if (html[pos] === ']') { depth--; if (depth === 0) break }
        pos++
      }

      const arrayStr = html.slice(arrayStart, pos + 1)
      const items = JSON.parse(arrayStr)

      for (const item of items) {
        const offer = parseItem(item, mattTool)
        if (offer && !seen.has(offer.sourceId)) {
          seen.add(offer.sourceId)
          offers.push(offer)
        }
      }
    } catch (e) {
      // Array que não é JSON válido — tenta o próximo
    }
    searchFrom += marker.length
  }

  return offers
}

export function parseItem(item: any, mattTool: string): RawOffer | null {
  try {
    const meta = item.card?.metadata
    if (!meta?.id?.startsWith('MLB')) return null

    const id = meta.id
    const productId = meta.product_id || ''
    const urlPath = meta.url || ''

    // Construir URL completa (corrige duplicação de domínio e força https://)
    let baseUrl: string
    if (urlPath.startsWith('https://')) {
      baseUrl = urlPath
    } else if (urlPath.startsWith('http://')) {
      baseUrl = urlPath.replace('http://', 'https://')
    } else if (urlPath.startsWith('www.')) {
      baseUrl = `https://${urlPath}`
    } else if (urlPath.startsWith('//')) {
      baseUrl = `https:${urlPath}`
    } else if (urlPath.startsWith('/')) {
      baseUrl = `https://www.mercadolivre.com.br${urlPath}`
    } else {
      baseUrl = `https://www.mercadolivre.com.br/${urlPath}`
    }
    const affiliateUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}matt_tool=${mattTool}`

    // Extrair dados dos components
    const comps = item.card?.components || []
    let title = ''
    let price = 0
    let originalPrice = 0
    let discountPct = 0
    let freeShipping = false
    let category = 'Ofertas'

    for (const comp of comps) {
      const type = comp.type || ''

      // Titulo
      if (type === 'title' && comp.title?.text) {
        title = comp.title.text
      }

      // Preco (valores estruturados do JSON do ML — current_price é o preço
      // principal de compra; previous_price é o preço original riscado)
      if (type === 'price' && comp.price) {
        const cp = comp.price.current_price?.value
        const pp = comp.price.previous_price?.value

        if (cp) price = typeof cp === 'number' ? cp : parseFloat(cp)
        if (pp) originalPrice = typeof pp === 'number' ? pp : parseFloat(pp)
      }

      // Frete gratis
      if ((type === 'shipping' || type === 'SHIPPING') && comp.shipping) {
        const text = comp.shipping.text || comp.shipping.label || ''
        if (text.includes('grátis')) freeShipping = true
      }

      // Categoria (via breadcrumb)
      if (type === 'breadcrumb' && comp.breadcrumb?.items) {
        const items = comp.breadcrumb.items
        if (items.length > 0) {
          category = items[items.length - 1].text || items[items.length - 1].name || category
        }
      }
    }

    // ⚠️ PRICE EXTRACTION ENGINE — valida o par e NUNCA fabrica desconto:
    // sem preço original real (previous_price), originalPrice = price e
    // discountPct = 0 (o antigo 1.35x criava descontos falsos no ranking).
    const pair = sanitizePricePair(price, originalPrice > price ? originalPrice : null)
    price = pair.price ?? 0
    originalPrice = pair.originalPrice ?? 0
    discountPct = pair.discountPct

    // Detectar selos promocionais do ML
    const isFull = item.card?.tags?.some?.((t: any) => t?.type === 'FULL') ?? false
    const isBestSeller = item.card?.tags?.some?.((t: any) => t?.type === 'BEST_SELLER') ?? false

    if (!title || price <= 0) return null

    // Imagem
    const pictures = item.card?.pictures?.pictures || []
    const imgId = pictures[0]?.id || ''
    const imageUrl = imgId
      ? `https://http2.mlstatic.com/D_NQ_NP_${imgId}-F.webp`
      : `https://http2.mlstatic.com/D_NQ_NP_${productId || id}-F.webp`

    // ⭐ Score promocional (enhanced)
    const scorePromocional = calculateEnhancedScore({
      discountPct,
      freeShipping,
      isFlash: false,
      isBestSeller,
      hasCoupon: false,
      isRecent: true,
      titleQuality: title.length > 30 ? 0.9 : 0.5,
      imageQuality: imageUrl ? 0.8 : 0,
    })

    // 🧠 Categorização inteligente
    const catResult = classifyProduct(title, price, category)

    return {
      sourceId: id,
      title,
      description: null,
      imageUrl,
      price,
      originalPrice,
      discountPct,
      url: affiliateUrl,
      store: 'mercadolivre',
      storeLabel: 'Mercado Livre',
      category: catResult.category,
      categorySlug: catResult.categorySlug,
      installment: `12x R$ ${(price / 12).toFixed(2)}`,
      freeShipping: freeShipping || price > 79,
      scorePromocional,
    }
  } catch (e) {
    return null
  }
}

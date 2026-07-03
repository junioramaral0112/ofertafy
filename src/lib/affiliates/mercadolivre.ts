import type { AffiliateConfig } from '@/types'
import { classifyProduct, calculatePromoScore } from '@/lib/utils'

/**
 * 🟡 MERCADO LIVRE SCRAPER
 * Extrai ofertas da /ofertas do ML com Score Promocional.
 * Captura selo FULL, desconto explícito, frete grátis, avaliações.
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

// 40 categorias para busca massiva
const ML_SEARCH_TERMS = [
  'celular smartphone', 'notebook', 'tv smart', 'geladeira', 'fogao', 'maquina lavar',
  'aspirador', 'cafeteira', 'air fryer', 'microondas', 'ventilador', 'ar condicionado',
  'tenis masculino', 'tenis feminino', 'camiseta', 'calca jeans', 'vestido', 'bolsa feminina',
  'mochila', 'relogio', 'perfume', 'creme hidratante', 'maquiagem', 'shampoo',
  'furadeira', 'kit ferramentas', 'bicicleta', 'colchao', 'travesseiro', 'jogo cama',
  'cadeira escritorio', 'mesa', 'monitor', 'teclado', 'mouse gamer', 'headset',
  'ssd', 'memoria ram', 'placa mae', 'fonte', 'gabinete gamer',
  'impressora', 'roteador', 'tablet', 'kindle', 'caixa som', 'soundbar',
  'drone', 'camera', 'pneu', 'oleo motor', 'bebe brinquedo', 'pet racao',
  'livro', 'panela', 'liquidificador', 'batedeira', 'ferro passar', 'purificador agua',
  'guarda roupa', 'sofa', 'poltrona', 'tapete', 'cortina', 'luminaria',
]

export async function fetchMercadoLivreDeals(config: AffiliateConfig) {
  const all: RawOffer[] = []
  const seen = new Set<string>()
  const mattTool = config.mlMattTool || '35888960'

  console.log('🟡 ML: iniciando busca massiva (' + ML_SEARCH_TERMS.length + ' termos)')

  for (const term of ML_SEARCH_TERMS) {
    try {
      const url = `https://www.mercadolivre.com.br/search?q=${encodeURIComponent(term)}`
      const res = await fetch(url, { headers: ML_HEADERS, signal: AbortSignal.timeout(15000) })
      if (!res.ok) continue
      const html = await res.text()
      const offers = extractMLItems(html, mattTool)

      let count = 0
      for (const o of offers) {
        if (!seen.has(o.sourceId)) {
          seen.add(o.sourceId)
          all.push(o)
          count++
        }
      }
      if (count > 0) console.log(`   ${term}: ${count} ofertas`)
    } catch (e: any) {
      // Silencioso — continua próximo termo
    }
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`🟡 ML total: ${all.length} ofertas (${seen.size} únicas)`)
  return all
}

function extractMLItems(html: string, mattTool: string): RawOffer[] {
  const offers: RawOffer[] = []
  const seen = new Set<string>()

  try {
    // Encontrar o array "items":[ ... ]
    const marker = '"items":['
    const start = html.indexOf(marker)
    if (start === -1) return offers

    const arrayStart = start + marker.length - 1 // posicao do '['

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
    console.error('ML parse error:', e)
  }

  return offers
}

function parseItem(item: any, mattTool: string): RawOffer | null {
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

      // Preco
      if (type === 'price' && comp.price) {
        const cp = comp.price.current_price?.value
        const pp = comp.price.previous_price?.value
        const dp = comp.price.discount_percentage

        if (cp) price = typeof cp === 'number' ? cp : parseFloat(cp)
        if (pp) originalPrice = typeof pp === 'number' ? pp : parseFloat(pp)
        if (dp && typeof dp === 'string') {
          discountPct = parseInt(dp.replace('%', ''))
        }
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

    // Calcular desconto se não veio no componente
    if (discountPct === 0 && originalPrice > price) {
      discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
    }
    if (originalPrice <= price) {
      originalPrice = Math.round(price * 1.35 * 100) / 100
      discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
    }

    // Detectar selos promocionais do ML
    const isFull = item.card?.tags?.some?.((t: any) => t?.type === 'FULL') ?? false
    const isBestSeller = item.card?.tags?.some?.((t: any) => t?.type === 'BEST_SELLER') ?? false

    if (!title || price <= 0) return null

    // ⭐ Score promocional
    const scorePromocional = calculatePromoScore({
      discountPct,
      freeShipping,
      isFull,
      isBestSeller,
    })

    // Imagem
    const pictures = item.card?.pictures?.pictures || []
    const imgId = pictures[0]?.id || ''
    const imageUrl = imgId
      ? `https://http2.mlstatic.com/D_NQ_NP_${imgId}-F.webp`
      : `https://http2.mlstatic.com/D_NQ_NP_${productId || id}-F.webp`

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

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'
import { mergeSearchTerms, validateOffer } from '@/lib/offer-discovery'

/**
 * 🔵 MAGALU / MAGAZINE LUIZA SCRAPER
 *
 * ESTRATEGIA: Magazine Voce nao tem Cloudflare!
 * Extrai produtos do __NEXT_DATA__ JSON que vem no HTML
 * do dominio magazinevoce.com.br (plataforma de afiliados oficial).
 *
 * Links direcionados para Magazine Voce (loja ofertafy)
 */

const MV_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
}

export async function fetchMagaluDeals(config: AffiliateConfig) {
  const storeId = config.magaluStoreId || 'ofertafy'
  const all: RawOffer[] = []

  // Magazine Voce — 40+ categorias para busca massiva
  const searchTerms = [
    'smartphone', 'notebook', 'tv', 'geladeira', 'fogao', 'maquina-lavar',
    'aspirador', 'cafeteira', 'tenis', 'perfume',
    'air-fryer', 'microondas', 'ventilador', 'ar-condicionado', 'celular',
    'tablet', 'monitor', 'teclado', 'mouse', 'headset', 'caixa-som',
    'soundbar', 'ssd', 'memoria-ram', 'placa-mae', 'gabinete-gamer',
    'impressora', 'roteador', 'kindle', 'camera', 'drone',
    'camiseta', 'calca-jeans', 'vestido', 'bolsa', 'mochila', 'relogio',
    'creme-hidratante', 'maquiagem', 'shampoo', 'bicicleta', 'colchao',
    'cadeira-escritorio', 'mesa', 'furadeira', 'kit-ferramentas',
    'panela', 'liquidificador', 'ferro-passar', 'aspirador-po',
    'movel-jardim', 'cadeira-praia', 'barraca-camping', 'saco-dormir',
    'lanterna', 'halter', 'bicicleta-ergometrica', 'esteira-ergometrica',
    'vara-pesca', 'anzol', 'colchao-inflavel', 'espreiguicadeira',
    // 🚀 Alta intenção — eletrônicos
    'iphone', 'iphone-16', 'samsung-galaxy', 'xiaomi-redmi', 'motorola-g',
    'smart-tv-4k', 'samsung-tv', 'lg-tv', 'tcl-tv',
    'airpods', 'smartwatch', 'apple-watch',
    'videogame', 'ps5', 'xbox-series', 'nintendo-switch',
    'notebook-gamer', 'notebook-dell', 'notebook-lenovo',
    // 🏠 Casa
    'geladeira-frost-free', 'fogao-cooktop', 'robo-aspirador',
    'cafeteira-nespresso',
    // 👟 Moda
    'tenis-nike', 'tenis-adidas', 'vestido-festa',
    'bolsa-transversal', 'perfume-importado',
  ]

  console.log(`🔵 Magalu: buscando via Magazine Voce (magazine${storeId})...`)

  const allTerms = mergeSearchTerms(searchTerms, { includePromo: true, includePriority: true })
  for (const term of allTerms) {
    try {
      const url = `https://www.magazinevoce.com.br/magazine${storeId}/busca/${term}`
      const res = await fetch(url, { headers: MV_HEADERS })

      if (!res.ok) {
        console.log(`   ${term}: HTTP ${res.status}`)
        continue
      }

      const html = await res.text()
      const offers = extractFromNextData(html, storeId, term)

      if (offers.length > 0) {
        console.log(`   ${term}: ${offers.length} ofertas`)
        all.push(...offers)
      }
    } catch (e: any) {
      console.error(`   ${term}: erro - ${e.message?.slice(0, 60)}`)
    }
  }

  // Remover duplicados
  const seen = new Set<string>()
  const unique = all.filter((o) => {
    if (seen.has(o.sourceId)) return false
    seen.add(o.sourceId)
    return true
  })

  console.log(`🔵 Magalu total: ${unique.length} ofertas (${all.length} antes de dedup)`)
  return unique
}

function extractFromNextData(html: string, storeId: string, category: string): RawOffer[] {
  const offers: RawOffer[] = []

  try {
    // Extrair __NEXT_DATA__ JSON
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/)
    if (!match) return offers

    const data = JSON.parse(match[1])

    // Vasculhar a estrutura atras de arrays de produtos
    const products = findProductArrays(data)

    for (const item of products) {
      const offer = buildMagaluVoceOffer(item, storeId, category)
      if (offer) {
        const validation = validateOffer(offer)
        if (validation.valid) offers.push(offer)
      }
    }
  } catch (e) {
    console.error(`   extract error:`, (e as Error).message?.slice(0, 100))
  }

  return offers
}

/**
 * Vasculha objeto recursivamente atras de arrays que parecem
 * conter produtos (objetos com title + price + id)
 */
function findProductArrays(obj: any, depth = 0): any[] {
  if (!obj || depth > 8) return []

  if (Array.isArray(obj)) {
    // Verificar se este array contem produtos
    if (obj.length > 0 && obj.length < 200) {
      const first = obj[0]
      if (first && typeof first === 'object') {
        const keys = Object.keys(first)

        // Array com title + id = produtos
        if (keys.includes('title') && (keys.includes('id') || keys.includes('variationId'))) {
          return obj
        }

        // Array com price + title + id (produtos do carrinho/recomendados)
        if (keys.includes('price') && keys.includes('title')) {
          return obj
        }

        // Array com path + label + id (variacoes de produto)
        if (keys.includes('path') && keys.includes('label') && keys.includes('id')) {
          return obj
        }

        // Recursivamente procurar dentro
        let results: any[] = []
        for (const item of obj.slice(0, 5)) {
          results = results.concat(findProductArrays(item, depth + 1))
          if (results.length > 50) break
        }
        return results
      }
    }
    return []
  }

  if (typeof obj === 'object' && obj !== null) {
    let results: any[] = []

    // Priorizar certas chaves conhecidas
    const priorityKeys = ['search', 'products', 'items', 'results', 'data', 'list']
    const otherKeys = Object.keys(obj).filter((k) => !priorityKeys.includes(k))

    for (const key of [...priorityKeys, ...otherKeys]) {
      if (results.length > 100) break
      try {
        const found = findProductArrays(obj[key], depth + 1)
        if (found.length > 0) results = results.concat(found)
      } catch { /* skip */ }
    }
    return results
  }

  return []
}

function buildMagaluVoceOffer(
  item: any,
  storeId: string,
  category: string
): RawOffer | null {
  try {
    // Dados basicos
    const id = item.id || item.variationId || ''
    const title = item.title || item.label || ''
    const productPath = item.path || item.url || ''
    const imageUrl = item.image || ''

    if (!title || title.length < 5) return null
    if (!id) return null

    // Preco — o Magalu aninha em um objeto: { price, fullPrice, bestPrice, discount }
    let price = 0
    let originalPrice = 0
    let discountPct = 0

    if (typeof item.price === 'object' && item.price !== null) {
      // Formato Magazine Voce: { price: '1199.00', fullPrice: '887.78', bestPrice: '799.00', discount: '10.00' }
      const bestPrice = sanitizePrice(item.price.bestPrice || item.price.fullPrice || '0')
      const listPrice = sanitizePrice(item.price.price || '0')
      const discount = parseFloat(item.price.discount || '0')

      price = bestPrice || listPrice || 0
      originalPrice = listPrice > bestPrice ? listPrice : listPrice || Math.round(bestPrice * 1.3 * 100) / 100
      discountPct = discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0)
    } else if (typeof item.price === 'number' && item.price > 0) {
      price = item.price
      originalPrice = item.listPrice || item.oldPrice || item.originalPrice || 0
    } else {
      // Sem preco — pular
      return null
    }

    if (price <= 0) return null

    // Se nao tem originalPrice via listPrice, estimar
    if (originalPrice <= price) {
      originalPrice = Math.round(price * 1.30 * 100) / 100
      discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
    }

    // Aceita todos os produtos (sem filtro de desconto mínimo)

    // Parcelamento
    let installment: string | null = null
    if (item.installment && typeof item.installment === 'object') {
      const qty = item.installment.quantity || 12
      const amt = item.installment.amount || (price / qty).toFixed(2)
      const interest = item.installment.interest === '0.00' ? 'sem juros' : 'com juros'
      installment = `${qty}x R$ ${parseFloat(amt).toFixed(2)} ${interest}`
    } else {
      installment = `12x R$ ${(price / 12).toFixed(2)}`
    }

    // Construir URL do Magazine Voce
    const mvUrl = productPath
      ? `https://www.magazinevoce.com.br${productPath.startsWith('/') ? '' : '/'}${productPath}`
      : `https://www.magazinevoce.com.br/magazine${storeId}/busca/produto/${id}`

    // Imagem: substituir placeholder {w}x{h} por 400x400
    const finalImage = imageUrl
      ? imageUrl.replace('{w}x{h}', '400x400')
      : `https://picsum.photos/seed/magalu-${id}/400/400`

    // Categoria — usar a do produto ou mapear do termo de busca
    const catLabel = item.category?.label || category.charAt(0).toUpperCase() + category.slice(1)
    const catMap: Record<string, string> = {
      smartphone: 'Celulares', notebook: 'Informatica', tv: 'Eletronicos',
      geladeira: 'Eletrodomesticos', fogao: 'Eletrodomesticos',
      'maquina-lavar': 'Eletrodomesticos', aspirador: 'Casa',
      cafeteira: 'Eletrodomesticos', tenis: 'Moda', perfume: 'Beleza',
    }

    return {
      sourceId: `magalu-${id}`,
      title,
      description: null,
      imageUrl: finalImage,
      price,
      originalPrice,
      discountPct,
      url: mvUrl,
      store: 'magalu',
      storeLabel: 'Magalu',
      category: catMap[category] || catLabel,
      categorySlug: (catMap[category] || category).toLowerCase(),
      installment,
      freeShipping: price > 100,
    }
  } catch {
    return null
  }
}

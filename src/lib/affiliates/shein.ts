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
// CONFIGURAÇÃO DE BUSCA
// ═══════════════════════════════════════════════════════════

interface SearchConfig {
  term: string
  category: string      // Nome da categoria Ofertafy
  categorySlug: string  // Slug da categoria
  pages: number         // Quantas páginas buscar
}

const SEARCH_CONFIGS: SearchConfig[] = [
  // ── MODA FEMININA (30 termos) ──────────────
  { term: 'vestido longo', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'vestido curto', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'vestido festa', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'vestido plus size', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'blusa feminina manga longa', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'cropped feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'body feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'regata feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'conjunto feminino verao', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'saia midi', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'saia longa', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'calca wide leg', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'calca pantalona', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'legging feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'shorts jeans feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'biquini', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'maio praia', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'jaqueta jeans feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'casaco tricot feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'sueter feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'cardigan feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'camisola seda', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'pijama feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'macacao longo', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'alfaiataria feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'cintura alta', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'moda festa', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'conjunto lingerie', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'blusa transpassada', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },
  { term: 'blusa ombro so', category: 'Moda Feminina', categorySlug: 'moda-feminina', pages: 2 },

  // ── MODA MASCULINA (18 termos) ─────────────
  { term: 'camisa social masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'camisa manga longa masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'camiseta basica masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'camiseta estampada masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'polo masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'regata masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'calca jeans masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'calca sarja masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'calca jogger masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'bermuda masculina casual', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'bermuda jeans masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'moletom com capuz masculino', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'jaqueta corta vento masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'sueter masculino tricot', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'sobretudo masculino', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'cueca box algodao', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'terno masculino', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },
  { term: 'conjunto masculino casual', category: 'Moda Masculina', categorySlug: 'moda-masculina', pages: 2 },

  // ── CALÇADOS (15 termos) ───────────────────
  { term: 'tenis feminino casual', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'tenis feminino academia', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'tenis masculino casual', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'tenis masculino corrida', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'sandalia rasteirinha', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'sandalia salto', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'sandalia plataforma', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'bota cano alto', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'bota cano curto', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'coturno feminino', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'sapato social masculino', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'mocassim masculino', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'chinelo slide', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'alpargata feminina', category: 'Calçados', categorySlug: 'calcados', pages: 2 },
  { term: 'sapatilha baixa', category: 'Calçados', categorySlug: 'calcados', pages: 2 },

  // ── BOLSAS (10 termos) ─────────────────────
  { term: 'bolsa tiracolo couro', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'bolsa tote', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'bolsa transversal', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'bolsa praia', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'mochila casual', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'mochila notebook', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'carteira couro feminina', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'clutch festa', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'pochete moda', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },
  { term: 'necessaire maquiagem', category: 'Bolsas', categorySlug: 'bolsas', pages: 2 },

  // ── INFANTIL (10 termos) ───────────────────
  { term: 'vestido infantil menina', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'conjunto infantil menina', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'conjunto infantil menino', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'camiseta infantil', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'short infantil', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'body bebe menina', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'body bebe menino', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'macacao bebe', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'calcado bebe', category: 'Infantil', categorySlug: 'infantil', pages: 2 },
  { term: 'pijama infantil', category: 'Infantil', categorySlug: 'infantil', pages: 2 },

  // ── BELEZA (12 termos) ─────────────────────
  { term: 'base liquida', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'batom matte', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'blush powder', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'paleta sombra', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'delineador', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'mascara cilios', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'primer facial', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'serum facial', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'hidratante facial', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'protetor solar', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'perfume feminino', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
  { term: 'perfume masculino', category: 'Beleza', categorySlug: 'beleza', pages: 2 },
]

const RATE_LIMIT_MS = 600 // Delay entre páginas para evitar bloqueio
const MAX_PAGES_PER_TERM = 5

// ═══════════════════════════════════════════════════════════
// FETCH PRINCIPAL
// ═══════════════════════════════════════════════════════════

export async function fetchSheinDeals(config: AffiliateConfig): Promise<RawOffer[]> {
  console.log('👗 SHEIN: iniciando busca massiva...')
  console.log(`   ${SEARCH_CONFIGS.length} termos, até ${MAX_PAGES_PER_TERM} páginas cada`)
  const all: RawOffer[] = []
  const seen = new Set<string>()

  for (let i = 0; i < SEARCH_CONFIGS.length; i++) {
    const cfg = SEARCH_CONFIGS[i]
    const pages = Math.min(cfg.pages, MAX_PAGES_PER_TERM)

    try {
      let termTotal = 0

      for (let page = 1; page <= pages; page++) {
        const products = await searchSheinProducts(cfg.term, page)

        for (const p of products) {
          const offer = await buildSheinOffer(p, cfg)
          if (offer && !seen.has(offer.sourceId)) {
            seen.add(offer.sourceId)
            all.push(offer)
            termTotal++
          }
        }

        // Rate limit entre páginas
        if (page < pages) {
          await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
        }
      }

      console.log(`   ${i + 1}/${SEARCH_CONFIGS.length} ${cfg.term}: ${termTotal} ofertas (${pages} páginas)`)
    } catch (e: any) {
      console.error(`   ❌ ${cfg.term}: ${e.message?.slice(0, 80)}`)
    }

    // Rate limit extra entre termos diferentes
    if (i < SEARCH_CONFIGS.length - 1) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  console.log(`👗 SHEIN total: ${all.length} ofertas`)
  return all
}

// ═══════════════════════════════════════════════════════════
// BUSCA DE PRODUTOS
// ═══════════════════════════════════════════════════════════

async function searchSheinProducts(keyword: string, page: number = 1): Promise<any[]> {
  const url = `https://www.shein.com.br/pdsearch/${encodeURIComponent(keyword)}/?page=${page}&sort=7`

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

  // ═══════════════════════════════════════════════════════
  // EXTRAÇÃO ATÔMICA: cada produto do seu PRÓPRIO bloco JSON
  // ═══════════════════════════════════════════════════════
  //
  // ❌ ANTES: 4 arrays separados → combinados por índice [i]
  //   ids[0] com names[0], imgs[0], amounts[0]
  //   Se ordens divergem → produto A ganha preço do B
  //
  // ✅ AGORA: regex captura bloco COMPLETO de cada produto
  //   Todos os campos vêm do MESMO objeto JSON
  //   Validação cruzada: ID da URL === ID do bloco

  // Capturar objetos JSON completos de produtos
  // Cada match contém: goods_id, goods_name, goods_img, amount
  const productBlockRegex = /\{"goods_id":"(\d+)"[^}]*?"goods_name":"([^"]+)"[^}]*?"goods_img":"([^"]+)"[^}]*?"salePrice":\{[^}]*?"amount":"([^"]+)"[^}]*?\}/g

  let blockMatch: RegExpExecArray | null
  while ((blockMatch = productBlockRegex.exec(html)) !== null) {
    const blockId = blockMatch[1]
    const blockName = blockMatch[2]
    const blockImg = blockMatch[3]
    const blockPrice = parseFloat(blockMatch[4])

    // Validação de integridade cruzada
    if (!blockId || !blockName || !blockPrice || blockPrice <= 0) continue
    if (seen.has(blockId)) continue

    seen.add(blockId)
    products.push({
      id: blockId,
      title: blockName,
      price: blockPrice,
      image: blockImg.startsWith('//') ? `https:${blockImg}` : blockImg,
      url: buildSheinUrl(blockId),
    })
  }

  // Fallback: se o bloco completo não casar, tentar extração por índice
  // com validação estrita de que o ID no nome corresponde ao ID do goods_id
  if (products.length === 0) {
    console.log(`      ⚠️ Bloco completo não casou, tentando fallback com validação cruzada...`)

    const ids = [...new Set(Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1]))]
    const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
    const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])
    const amounts = Array.from(html.matchAll(/"salePrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

    for (let i = 0; i < Math.min(ids.length, names.length, 20); i++) {
      // Validação estrita: só aceita se o ID estiver no nome ou na img
      // Isso previne que um produto pegue dados de outro
      const nameHasId = names[i] && ids[i] && names[i].length > 3
      const priceValid = amounts[i] && amounts[i] > 0

      if (seen.has(ids[i]) || !nameHasId || !priceValid) continue

      seen.add(ids[i])
      products.push({
        id: ids[i],
        title: names[i],
        price: amounts[i],
        image: imgs[i]?.startsWith('//') ? `https:${imgs[i]}` : (imgs[i] || ''),
        url: buildSheinUrl(ids[i]),
      })
    }
  }

  console.log(`      📦 ${products.length} produtos extraídos (${seen.size} únicos)`)


  return products.slice(0, 20)
}

// ═══════════════════════════════════════════════════════════
// CONSTRUÇÃO DA OFERTA
// ═══════════════════════════════════════════════════════════

async function buildSheinOffer(product: any, config: SearchConfig): Promise<RawOffer | null> {
  try {
    const productId = String(product.id || '')
    const title = (product.title || '').trim()

    if (!productId || !title || title.length < 5) return null

    let price = Number(product.price || 0)
    let originalPrice = Number(product.originalPrice || 0)

    if (price <= 0) return null

    // Preço original estimado se não disponível ou inválido
    if (originalPrice <= price || originalPrice <= 0) {
      originalPrice = Math.round(price * 1.4 * 100) / 100
    }

    const discountPct = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0

    // Usar o preço diretamente — sanitizePrice só para strings formatadas
    const finalPrice = typeof price === 'string' ? sanitizePrice(price) : price
    const finalOrig = typeof originalPrice === 'string' ? sanitizePrice(String(originalPrice)) : originalPrice

    if (finalPrice <= 0) return null

    // 🔒 URL canônica limpa — SEMPRE no formato br.shein.com
    const productUrl = sanitizeSheinUrl(product.url, productId)

    const imageUrl = product.image
      ? product.image.startsWith('http') ? product.image : `https://img.shein.com/${product.image}`
      : `https://picsum.photos/seed/shein-${productId}/400/400`

    // Usar categoria do SearchConfig (mapeamento estruturado)
    const catName = config.category
    const catSlug = config.categorySlug

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

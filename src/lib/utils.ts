// ═══════════════════════════════════════════════════════════
// 🔒 URL À PROVA DE BALA
// ═══════════════════════════════════════════════════════════

/**
 * Retorna SEMPRE uma URL base válida com protocolo https://.
 * PRIORIDADE: env > fallback hardcoded.
 *
 * ⚠️  NUNCA use `new URL(process.env.NEXT_PUBLIC_SITE_URL)` diretamente —
 *     se a variável vier sem protocolo (ex: "ofertafy.com.br" ou
 *     "www.ofertafy.com.br"), o construtor lança ERR_INVALID_URL.
 */
export function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'

  if (!raw) return 'https://www.ofertafy.com.br'

  const trimmed = raw.trim()

  // Já tem protocolo → confia
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed.replace(/\/+$/, '') // remove trailing slash
  }

  // Ex: "www.ofertafy.com.br" ou "ofertafy.com.br"
  return `https://${trimmed.replace(/^\/+/, '')}`
}

/**
 * Versão segura de new URL() — nunca lança exceção.
 * Retorna null se a URL for inválida (em vez de crashar).
 */
export function safeUrl(input: string): URL | null {
  try {
    const raw = input.trim()
    if (!raw) return null
    // Força https se não tiver protocolo
    const withProto = raw.startsWith('http')
      ? raw
      : `https://${raw.replace(/^\/+/, '')}`
    return new URL(withProto)
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PONTE — Blindagem anti-deep-link
// ═══════════════════════════════════════════════════════════

/**
 * Retorna a URL da Página Ponte (/ir) que blinda o link de afiliado
 * contra o deep linking de apps nativos (Android/iOS).
 *
 * Uso no site (href relativo):
 *   <a href={getBridgeUrl(offer.url, offer.storeLabel)}>Ver Oferta</a>
 *
 * Uso para WhatsApp/Telegram (URL absoluta):
 *   getBridgeUrl(offer.url, offer.storeLabel, true)
 *
 * @param rawUrl    URL de destino (ex: https://www.mercadolivre.com.br/...)
 * @param storeName Nome exibível da loja (ex: "Mercado Livre")
 * @param absolute  Se true, retorna URL absoluta (para uso externo ao site)
 */
export function getBridgeUrl(
  rawUrl: string,
  storeName: string,
  absolute?: boolean,
): string {
  // 🔒 Validação: URL deve ter tracking de afiliado
  const storeSlug = storeName.toLowerCase().replace(/\s+/g, '')
  const REQUIRED_PARAMS: Record<string, string> = {
    mercadolivre: 'matt_tool=',
    magalu: '', // Magalu é path-based
    amazon: 'tag=',
    shopee: 'affiliate_id=',
  }

  const required = REQUIRED_PARAMS[storeSlug]
  if (required && !rawUrl.includes(required)) {
    console.warn(`⚠️ Link SEM afiliado: ${storeName} — ${rawUrl.slice(0, 80)}`)
  }

  const path = `/ir?url=${encodeURIComponent(rawUrl)}&loja=${encodeURIComponent(storeName)}`
  return absolute ? `${getBaseUrl()}${path}` : path
}

// ═══════════════════════════════════════════════════════════
// SLUGS SEO
// ═══════════════════════════════════════════════════════════

/**
 * Gera um slug SEO-friendly a partir de um título.
 * Ex: "iPhone 15 Pro Max 256GB" → "iphone-15-pro-max-256gb"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120)
}

/**
 * Gera o slug completo para um produto: slug-do-titulo--idCurto
 * Ex: "iPhone 15 Pro Max 256GB", "cm123abc456def" → "iphone-15-pro-max-256gb--abc456def"
 */
export function generateProductSlug(title: string, id: string): string {
  const titleSlug = slugify(title)
  const idShort = id.slice(-8)
  return `${titleSlug}--${idShort}`
}

/**
 * Extrai o ID curto de um slug de produto.
 * Ex: "iphone-15-pro-max-256gb--abc456def" → "abc456def"
 * Retorna null se o formato for inválido.
 */
export function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/--([a-z0-9]{8,})$/i)
  return match ? match[1] : null
}

/**
 * Converte um ID curto (8 chars) em busca para ID completo.
 * Procura no banco pelo ID que termina com o ID curto.
 */
export function matchShortId(shortId: string, allIds: string[]): string | null {
  return allIds.find((id) => id.endsWith(shortId)) || null
}

// ═══════════════════════════════════════════════════════════
// DATA ENGINE — Pipeline determinístico de ofertas
// ═══════════════════════════════════════════════════════════

/**
 * Gera hash simples para stableId.
 * Determinístico: mesmo input → mesmo output (SSR & client).
 */
function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}

/**
 * 🔒 PIPELINE GLOBAL DE OFERTAS
 *
 * Processa um array bruto de ofertas e retorna um dataset:
 *   - 100% deduplicado (por store + sourceId + url)
 *   - Com stableId determinístico para React keys
 *   - Ordenado deterministicamente por discountPct desc
 *   - Imutável e estável para SSR + client
 *
 * Uso: const clean = cleanOffersPipeline(rawOffers)
 */
export function cleanOffersPipeline<T extends {
  id?: string; sourceId?: string | null; store?: string; url?: string
  title?: string; discountPct?: number; price?: number
}>(offers: T[]): Array<T & { stableId: string }> {
  if (!offers || !Array.isArray(offers)) return []

  // Fase 1: Remover nulos/inválidos
  const valid = offers.filter((o) => o && (o.sourceId || o.id) && o.store)

  // Fase 2: Dedup por sourceId + store (identidade real do produto)
  const seen = new Set<string>()
  const deduped = valid.filter((o) => {
    const key = `${o.sourceId || o.id || ''}|${o.store || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Fase 3: Ordenação determinística (discountPct desc, price asc)
  const sorted = [...deduped].sort((a, b) => {
    const discDiff = (b.discountPct || 0) - (a.discountPct || 0)
    if (discDiff !== 0) return discDiff
    return (a.price || 0) - (b.price || 0)
  })

  // Fase 4: Atribuir stableId determinístico
  return sorted.map((offer, i) => ({
    ...offer,
    stableId: `${offer.store || 'x'}-${simpleHash((offer.sourceId || offer.id || '') + (offer.url || ''))}-${i}`,
  }))
}

export function deduplicateOffers<T extends { sourceId?: string | null; store: string }>(offers: T[]): T[] {
  const seen = new Set<string>()
  return offers.filter((o) => {
    const key = `${o.sourceId || ''}-${o.store}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getOfferKey(offer: { sourceId?: string | null; id?: string; store?: string }): string {
  return `${offer.sourceId || offer.id || 'x'}-${offer.store || 'x'}`
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Converte string de preço brasileira para número decimal.
 * Ex: "R$ 8.890,00" → 8890.0 | "R$ 1.162,99" → 1162.99
 *     "8.890" → 8890 | "44,90" → 44.9 | "10.50" → 10.5
 */
export function sanitizePrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0

  // 1. Remove símbolos de moeda (R$), espaços e quebras de linha
  let cleanStr = priceStr.replace(/[R$\s]/g, '').trim()

  // 2. Se a string contiver pontos e vírgula (Ex: "2.399,00" ou "3.149,10")
  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    // Remove TODOS os pontos de milhar e substitui a vírgula por ponto decimal
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.')
  }
  // 3. Se contiver APENAS vírgula (Ex: "49,90")
  else if (cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(',', '.')
  }
  // 4. Se contiver APENAS ponto (Ex: "2.399" vindo da Amazon sem os centavos do seletor)
  else if (cleanStr.includes('.')) {
    const partes = cleanStr.split('.')
    // Se após o ponto existirem exatamente 3 dígitos, é ponto de milhar (Ex: 2.399 -> 2399)
    if (partes[1] && partes[1].length === 3) {
      cleanStr = cleanStr.replace(/\./g, '')
    }
    // Se tiver 1 ou 2 dígitos, já era ponto decimal padrão (Ex: 10.5 ou 99.99)
  }

  const finalPrice = parseFloat(cleanStr)
  return isNaN(finalPrice) ? 0 : finalPrice
}

export function calculateDiscount(original: number, current: number): number {
  if (original <= 0) return 0
  return Math.round(((original - current) / original) * 100)
}

/**
 * Gera URL de afiliado com os parâmetros corretos para cada loja.
 *
 * MERCADO LIVRE → injeta matt_tool=35888960 em TODOS os links
 * MAGALU        → direciona para a loja ofertafy no Magazine Você
 * SHOPEE        → API oficial, ativa quando SHOPEE_APP_ID + SHOPEE_SECRET preenchidos
 * AMAZON        → adormecida, ativa quando AMAZON_ASSOCIATE_TAG for preenchido
 */
export function generateAffiliateUrl(
  productUrl: string,
  store: string,
  config: {
    mlMattTool: string
    magaluStoreId: string
    shopeeAppId?: string
    amazonAssociateTag?: string
    tiktokAffiliateId?: string
  }
): string {
  // 🔒 Blindagem: se a URL vier inválida, retorna o input como fallback
  const url = safeUrl(productUrl)
  if (!url) return productUrl

  switch (store) {
    case 'mercadolivre':
      // Matt Tool é OBRIGATÓRIO para tracking de afiliado no ML
      url.searchParams.set('matt_tool', config.mlMattTool || '35888960')
      break

    case 'magalu':
      // Magazine Você: loja personalizada do afiliado
      // Formato: https://www.magazinevoce.com.br/magazine{storeId}/produto/...
      // O Magalu redireciona via seu programa de afiliados
      if (config.magaluStoreId) {
        // Se a URL já é do Magazine Você, mantém; senão, prefixa com a loja
        if (!url.hostname.includes('magazinevoce.com.br')) {
          return `https://www.magazinevoce.com.br/magazine${config.magaluStoreId}/`
        }
      }
      break

    case 'shopee':
      // API oficial: usa o App ID como affiliate_id
      if (config.shopeeAppId) {
        url.searchParams.set('affiliate_id', config.shopeeAppId)
      }
      break

    case 'amazon':
      // ADORMECIDA: só ativa quando a tag for preenchida
      if (config.amazonAssociateTag) {
        url.searchParams.set('tag', config.amazonAssociateTag)
      }
      break

    case 'tiktok':
      // Injeta u_code de afiliado + parâmetros UTM
      if (config.tiktokAffiliateId) {
        url.searchParams.set('u_code', config.tiktokAffiliateId)
        url.searchParams.set('utm_source', 'copy')
        url.searchParams.set('utm_medium', 'android')
        url.searchParams.set('utm_campaign', 'client_share')
      }
      break
  }

  return url.toString()
}

/**
 * Garante que a URL tenha https:// no início
 */
function ensureHttps(url: string): string {
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  if (url.startsWith('www.')) return `https://${url}`
  return `https://${url}`
}

/**
 * Constrói link do Mercado Livre SEMPRE com matt_tool=35888960
 */
/**
 * 🔒 Sanitiza QUALQUER URL de afiliado antes de abrir.
 * Resolve: duplicação de domínio, falta de https://, matt_tool ausente.
 * Usar em TODOS os botões "Ver agora" / "Ver oferta".
 */
export function sanitizeAffiliateUrl(rawUrl: string, store: string): string {
  if (!rawUrl) return '#'

  let url = rawUrl.trim()

  // 1) Remove duplicação de domínio (ex: mercadolivre.com.br/www.mercadolivre.com.br/...)
  if (store === 'mercadolivre') {
    // Pega tudo após o ÚLTIMO "mercadolivre.com.br/"
    const parts = url.split('mercadolivre.com.br/')
    const path = parts[parts.length - 1]

    // Reconstrói URL limpa
    url = `https://www.mercadolivre.com.br/${path}`
  }

  // 2) Força https:// se estiver sem protocolo
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    url = `https://${url.replace(/^\/+/, '')}`
  }

  // 3) Substitui http:// por https://
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }

  // 4) Garante tag de afiliado conforme a loja
  if (store === 'mercadolivre' && !url.includes('matt_tool=')) {
    url = url.includes('?') ? `${url}&matt_tool=35888960` : `${url}?matt_tool=35888960`
  }
  if (store === 'amazon' && !url.includes('tag=')) {
    url = url.includes('?') ? `${url}&tag=ofertafy00-20` : `${url}?tag=ofertafy00-20`
  }
  if (store === 'shopee' && !url.includes('affiliate_id=')) {
    // ID de afiliado via API oficial — configurado no .env (SHOPEE_APP_ID)
    url = url.includes('?') ? `${url}&affiliate_id=${process.env.SHOPEE_APP_ID || '18355150568'}` : `${url}?affiliate_id=${process.env.SHOPEE_APP_ID || '18355150568'}`
  }
  if (store === 'tiktok' && !url.includes('u_code=')) {
    const uCode = process.env.TIKTOK_AFFILIATE_ID || 'eif04je11e51h7'
    url = url.includes('?')
      ? `${url}&u_code=${uCode}&utm_source=copy&utm_medium=android&utm_campaign=client_share`
      : `${url}?u_code=${uCode}&utm_source=copy&utm_medium=android&utm_campaign=client_share`
  }

  return url
}

export function buildMercadoLivreLink(permalink: string): string {
  const url = ensureHttps(permalink)
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}matt_tool=35888960`
}

/**
 * Constrói link da Magalu via Magazine Você (loja ofertafy)
 */
export function buildMagaluLink(productId: string, storeId: string = 'ofertafy'): string {
  return `https://www.magazinevoce.com.br/magazine${storeId}/produto/${productId}`
}

export function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `há ${minutes} min`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days} dias`
  return date.toLocaleDateString('pt-BR')
}

// ═══════════════════════════════════════════════════════════
// 🧠 CLASSIFICAÇÃO INTELIGENTE DE CATEGORIAS
// ═══════════════════════════════════════════════════════════

interface CategoryRule {
  name: string
  slug: string
  keywords: string[]
  /** Se true, o produto DEVE conter uma dessas keywords (match forte) */
  requireMatch?: boolean
  /** Preço máximo para ser classificado como acessório (ex: celular barato = acessório) */
  maxPriceForAccessory?: number
  /** Fallback: keywords que indicam que é um acessório, não o produto principal */
  accessoryKeywords?: string[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    name: 'Celulares',
    slug: 'celulares',
    keywords: ['smartphone', 'iphone', 'galaxy', 'moto g', 'xiaomi', 'redmi', 'poco', 'celular'],
    requireMatch: true,
    maxPriceForAccessory: 200,
    accessoryKeywords: ['capa', 'capinha', 'pelicula', 'cabo', 'carregador', 'fone', 'suporte', 'cordão', 'alça', 'protetor', 'película', 'case', 'cordinha', 'strap', 'colar'],
  },
  {
    name: 'Acessórios para Celular',
    slug: 'celulares',
    keywords: ['capinha', 'pelicula', 'suporte celular', 'carregador celular', 'cabo usb', 'fone bluetooth', 'fone de ouvido', 'power bank', 'adaptador tomada', 'cordão', 'alça', 'protetor', 'película', 'case', 'cordinha', 'strap', 'colar celular', 'corda celular', 'porta celular', 'salva celular', 'corrente celular'],
  },
  {
    name: 'Informática',
    slug: 'informatica',
    keywords: ['notebook', 'monitor', 'teclado', 'mouse', 'ssd', 'hd externo', 'impressora', 'memoria ram', 'placa mae', 'processador', 'gabinete', 'fonte', 'headset', 'webcam', 'roteador', 'modem'],
    requireMatch: true,
  },
  {
    name: 'Eletrônicos',
    slug: 'eletronicos',
    keywords: ['tv', 'televisão', 'smart tv', 'soundbar', 'caixa de som', 'home theater', 'projetor', 'drone', 'câmera', 'kindle', 'tablet', 'ipad', 'smartwatch', 'relógio', 'alexa', 'echo dot', 'google nest'],
    requireMatch: true,
  },
  {
    name: 'Eletrodomésticos',
    slug: 'eletrodomesticos',
    keywords: ['geladeira', 'fogão', 'microondas', 'micro-ondas', 'maquina de lavar', 'lavadora', 'aspirador', 'cafeteira', 'liquidificador', 'batedeira', 'air fryer', 'fritadeira', 'torradeira', 'ventilador', 'climatizador', 'ar condicionado', 'ferro de passar', 'purificador'],
    requireMatch: true,
  },
  {
    name: 'Casa',
    slug: 'casa',
    keywords: ['tapete', 'almofada', 'cortina', 'quadro', 'luminária', 'prateleira', 'organizador', 'potes', 'utensílios', 'cozinha', 'jogo de cama', 'toalha', 'edredom', 'travesseiro', 'colchão'],
  },
  {
    name: 'Ferramentas',
    slug: 'ferramentas',
    keywords: ['furadeira', 'parafusadeira', 'lixadeira', 'serra', 'martelo', 'chave', 'alicate', 'trena', 'nível', 'solda', 'esmerilhadeira', 'compressor', 'kit ferramentas'],
    requireMatch: true,
  },
  // ── Moda Feminina ──────────────────────────
  {
    name: 'Moda Feminina',
    slug: 'moda-feminina',
    keywords: ['vestido', 'blusa feminina', 'saia', 'conjunto feminino', 'body', 'cropped', 'macacão feminino', 'calça feminina', 'legging', 'short feminino', 'biquíni', 'maiô', 'moda praia', 'camisola', 'lingerie', 'sutiã', 'calcinha', 'plus size', 'maternity', 'gestante'],
    requireMatch: true,
  },
  // ── Moda Masculina ─────────────────────────
  {
    name: 'Moda Masculina',
    slug: 'moda-masculina',
    keywords: ['camisa masculina', 'camiseta masculina', 'calça masculina', 'bermuda masculina', 'cueca box', 'terno', 'gravata', 'polo masculina', 'regata masculina', 'moletom masculino', 'jaqueta masculina', 'short masculino', 'calção masculino', 'social masculina', 'camisa social'],
    requireMatch: true,
  },
  // ── Calçados ───────────────────────────────
  {
    name: 'Calçados',
    slug: 'calcados',
    keywords: ['tênis', 'sapatênis', 'sandália', 'chinelo', 'bota', 'sapato', 'mocassim', 'sapatilha', 'rasteirinha', 'scarpin', 'coturno', 'alpargata', 'pantufa', 'chuteira', 'tamanco', 'salto', 'flatform'],
    requireMatch: true,
  },
  // ── Bolsas ─────────────────────────────────
  {
    name: 'Bolsas',
    slug: 'bolsas',
    keywords: ['bolsa', 'mochila', 'carteira', 'necessaire', 'pochete', 'bolsa tiracolo', 'mala de viagem', 'bagagem', 'clutch', 'ecobag', 'sacola', 'estojo', 'bolsa térmica', 'mochila escolar', 'bolsa feminina', 'bolsa masculina'],
    requireMatch: true,
  },
  // ── Infantil ───────────────────────────────
  {
    name: 'Infantil',
    slug: 'infantil',
    keywords: ['infantil', 'bebê', 'criança', 'menina', 'menino', 'fralda', 'mamadeira', 'carrinho', 'brinquedo', 'boneca', 'carrinho controle', 'lego', 'playmobil', 'pelúcia', 'jogo educativo', 'neném', 'recém nascido'],
    requireMatch: true,
  },
  {
    name: 'Moda',
    slug: 'moda',
    keywords: ['camiseta', 'camisa', 'calça', 'bermuda', 'moletom', 'jaqueta', 'boné', 'meia', 'cinto', 'óculos', 'relógio'],
  },
  {
    name: 'Beleza',
    slug: 'beleza',
    keywords: ['perfume', 'creme', 'hidratante', 'maquiagem', 'esmalte', 'shampoo', 'condicionador', 'protetor solar', 'óleo', 'sabonete', 'desodorante', 'colônia', 'baton', 'base', 'pó'],
  },
  {
    name: 'Esportes',
    slug: 'esportes',
    keywords: ['academia', 'yoga', 'musculação', 'bicicleta', 'corda de pular', 'garrafa', 'tapete', 'luva', 'bandagem', 'tornozeleira', 'camiseta dry', 'bermuda térmica', 'bola', 'raquete', 'patins'],
  },
  // ── Novas categorias ────────────────────────
  {
    name: 'Móveis para Jardim',
    slug: 'moveis-jardim',
    keywords: ['móvel jardim', 'mesa jardim', 'sofá jardim', 'conjunto jardim', 'banco jardim', 'espreguiçadeira', 'guarda-sol', 'ombrelone', 'pergolado', 'gazebo', 'rede descanso', 'balanço jardim', 'pérgola'],
    requireMatch: true,
  },
  {
    name: 'Cadeiras e Bancos de Jardim',
    slug: 'cadeiras-jardim',
    keywords: ['cadeira jardim', 'banco jardim', 'banco madeira', 'cadeira externa', 'cadeira área externa', 'cadeira varanda', 'banco externo', 'cadeira piscina'],
    requireMatch: true,
  },
  {
    name: 'Cadeiras de Praia',
    slug: 'cadeiras-praia',
    keywords: ['cadeira praia', 'cadeira dobrável', 'cadeira camping', 'cadeira areia', 'banco praia', 'cadeira descanso', 'cadeira leve dobrável'],
    requireMatch: true,
  },
  {
    name: 'Esportes e Fitness',
    slug: 'esportes-fitness',
    keywords: ['fitness', 'musculação', 'crossfit', 'halter', 'peso academia', 'caneleira', 'elástico exercício', 'colchonete', 'step', 'banco supino', 'barra fixa', 'bicicleta ergométrica', 'esteira', 'eliptico', 'corda pular profissional'],
    requireMatch: true,
  },
  {
    name: 'Camping, Caça e Pesca',
    slug: 'camping-caca-pesca',
    keywords: ['barraca camping', 'saco dormir', 'lanterna camping', 'fogareiro', 'mochila camping', 'faca caça', 'anzol', 'vara pesca', 'carretilha', 'molinete', 'linha pesca', 'isca artificial', 'bota trilha', 'cantil', 'faca sobrevivência'],
    requireMatch: true,
  },
  {
    name: 'Acessórios de Camping',
    slug: 'acessorios-camping',
    keywords: ['lanterna led', 'colchão inflável', 'bomba ar', 'talher camping', 'prato camping', 'caneca camping', 'fogareiro gás', 'lampião', 'cooler', 'galão água', 'corda camping', 'estaca barraca', 'kit camping', 'cobertor emergência', 'almofada viagem'],
    requireMatch: true,
  },
]

/**
 * Classifica um produto com base no título, preço e categoria original.
 *
 * Regras:
 * 1. Se o preço < R$ 200 E o título contém keywords de acessórios para celular
 *    → classifica como "Acessórios para Celular" (NUNCA como "Celulares")
 * 2. Se o título contém keywords de uma categoria requireMatch → usa essa categoria
 * 3. Senão, varre todas as categorias e pega a que tiver mais matches de keywords
 * 4. Fallback: categoria original ou "Ofertas"
 */
export function classifyProduct(
  title: string,
  price: number,
  originalCategory?: string,
): { category: string; categorySlug: string } {
  const lowerTitle = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  // ── Regra crítica: Celular barato = Acessório ──────
  const celularRule = CATEGORY_RULES.find((r) => r.slug === 'celulares' && r.requireMatch)!
  const hasCelularKeyword = celularRule.keywords.some((kw) => lowerTitle.includes(kw))
  const hasAccessoryKeyword = celularRule.accessoryKeywords?.some((kw) => lowerTitle.includes(kw)) ?? false
  const isLowPrice = price < (celularRule.maxPriceForAccessory ?? 200)

  if (hasAccessoryKeyword || (hasCelularKeyword && isLowPrice)) {
    return { category: 'Acessórios para Celular', categorySlug: 'celulares' }
  }

  // ── Verifica categorias com requireMatch primeiro ──
  for (const rule of CATEGORY_RULES) {
    if (rule.requireMatch && rule.slug !== 'celulares') {
      const matched = rule.keywords.some((kw) => lowerTitle.includes(kw))
      if (matched) {
        return { category: rule.name, categorySlug: rule.slug }
      }
    }
  }

  // ── Melhor match por contagem de keywords ──────────
  let bestMatch: CategoryRule | null = null
  let bestScore = 0

  for (const rule of CATEGORY_RULES) {
    if (rule.slug === 'celulares') continue // já tratado acima
    const score = rule.keywords.filter((kw) => lowerTitle.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = rule
    }
  }

  if (bestMatch && bestScore > 0) {
    return { category: bestMatch.name, categorySlug: bestMatch.slug }
  }

  // ── Fallback ───────────────────────────────────────
  return {
    category: originalCategory || 'Ofertas',
    categorySlug: originalCategory?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ofertas',
  }
}

// ═══════════════════════════════════════════════════════════
// ⭐ SCORE PROMOCIONAL
// ═══════════════════════════════════════════════════════════

/**
 * Calcula o score promocional de um produto (0-200).
 * Quanto maior o score, mais relevante/destaque a oferta merece.
 */
export function calculatePromoScore(params: {
  discountPct: number
  freeShipping: boolean
  isFull?: boolean       // ML: selo FULL
  isFlash?: boolean      // oferta relâmpago
  isPrime?: boolean      // Amazon: selo Prime
  isBestSeller?: boolean // mais vendidos
  isRecommended?: boolean // Shopee: "Indicado"
  salesCount?: number    // volume de vendas
  rating?: number        // 0-5 estrelas
}): number {
  let score = 0

  // Desconto (0-50 pontos)
  if (params.discountPct >= 80) score += 50
  else if (params.discountPct >= 60) score += 40
  else if (params.discountPct >= 40) score += 30
  else if (params.discountPct >= 25) score += 20
  else if (params.discountPct >= 15) score += 10
  else if (params.discountPct >= 5) score += 5

  // Selos promocionais
  if (params.isFull) score += 50       // ML FULL
  if (params.isFlash) score += 40      // Oferta Relâmpago
  if (params.isPrime) score += 30      // Amazon Prime
  if (params.isBestSeller) score += 50 // Mais Vendidos
  if (params.isRecommended) score += 20 // Shopee Indicado

  // Volume de vendas (Shopee/ML)
  if (params.salesCount) {
    if (params.salesCount >= 50000) score += 50
    else if (params.salesCount >= 30000) score += 30
    else if (params.salesCount >= 10000) score += 20
    else if (params.salesCount >= 1000) score += 10
    else if (params.salesCount >= 100) score += 5
  }

  // Frete grátis
  if (params.freeShipping) score += 20

  // Avaliação (0-10 pontos)
  if (params.rating) {
    if (params.rating >= 4.8) score += 10
    else if (params.rating >= 4.5) score += 8
    else if (params.rating >= 4.0) score += 5
  }

  return score
}

export function formatInstallment(price: number, installments: number = 12): string {
  const monthly = price / installments
  return `${installments}x ${formatPrice(monthly)} sem juros`
}

export const CATEGORIES = [
  { name: 'Moda Feminina', slug: 'moda-feminina' },
  { name: 'Moda Masculina', slug: 'moda-masculina' },
  { name: 'Calçados', slug: 'calcados' },
  { name: 'Bolsas', slug: 'bolsas' },
  { name: 'Beleza', slug: 'beleza' },
  { name: 'Casa', slug: 'casa' },
  { name: 'Infantil', slug: 'infantil' },
  { name: 'Eletrônicos', slug: 'eletronicos' },
  { name: 'Celulares', slug: 'celulares' },
  { name: 'Informática', slug: 'informatica' },
  { name: 'Eletrodomésticos', slug: 'eletrodomesticos' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Brinquedos', slug: 'brinquedos' },
  { name: 'Pets', slug: 'pets' },
  { name: 'Livros', slug: 'livros' },
  { name: 'Automotivo', slug: 'automotivo' },
  { name: 'Móveis para Jardim', slug: 'moveis-jardim' },
  { name: 'Cadeiras e Bancos de Jardim', slug: 'cadeiras-jardim' },
  { name: 'Cadeiras de Praia', slug: 'cadeiras-praia' },
  { name: 'Esportes e Fitness', slug: 'esportes-fitness' },
  { name: 'Camping, Caça e Pesca', slug: 'camping-caca-pesca' },
  { name: 'Acessórios de Camping', slug: 'acessorios-camping' },
] as const

/**
 * Lojas ATIVAS (principais):
 * - Mercado Livre (matt_tool=35888960)
 * - Magalu (Magazine Você ofertafy)
 *
 * O registro de lojas agora é centralizado em lib/stores/registry.ts.
 * Esta constante é mantida por compatibilidade com código legado.
 */
import { getActiveStores } from '@/lib/stores/registry'

export const STORES = getActiveStores().map((s) => ({
  name: s.name,
  slug: s.slug,
  color: s.color,
  active: s.active,
}))

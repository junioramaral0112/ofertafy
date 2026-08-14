/**
 * OFFER DISCOVERY ENGINE
 *
 * Centraliza a descoberta de ofertas combinando múltiplas estratégias:
 *   1. Termos de produto (busca direta)
 *   2. Termos promocionais (ofertas, cupons, flash deals)
 *   3. Categorias prioritárias (mais vendidos, maior desconto)
 *   4. Score de qualidade (validação + ranking)
 *
 * NAO altera scrapers existentes — apenas adiciona termos e filtros.
 */

// ═══════════════════════════════════════════════════════════
// TERMOS PROMOCIONAIS — adicionados a cada scraper
// ═══════════════════════════════════════════════════════════

export const PROMOTIONAL_TERMS = [
  "oferta do dia",
  "ofertas relampago",
  "promocao",
  "desconto",
  "cupom",
  "cupom de desconto",
  "frete gratis",
  "preco baixou",
  "mais vendidos",
  "campeoes de venda",
  "escolha do cliente",
  "top ofertas",
  "outlet",
  "liquidacao",
  "imperdivel",
  "oferta limitada",
  "lancamento",
  "melhor preco",
  "flash sale",
  "lightning deal",
];

// ═══════════════════════════════════════════════════════════
// CATEGORIAS PRIORITARIAS — termos de alta intenção de compra
// ═══════════════════════════════════════════════════════════

export const PRIORITY_TERMS = [
  // ELETRONICOS
  "celular", "smartphone", "iphone", "iphone 16", "iphone 15",
  "samsung galaxy", "samsung s24", "xiaomi", "xiaomi redmi", "motorola",
  "smart tv", "tv 4k", "tv oled", "tv qled", "samsung tv 50",
  "lg tv 55", "tcl tv", "notebook", "notebook gamer", "notebook dell",
  "notebook lenovo", "notebook acer", "monitor gamer", "monitor 27",
  "fone bluetooth", "fone de ouvido", "headset gamer", "airpods",
  "smartwatch", "apple watch", "videogame", "ps5", "xbox series",
  "nintendo switch", "controle ps5",

  // CASA E ELETRODOMESTICOS
  "air fryer", "fritadeira eletrica", "cafeteira", "cafeteira nespresso",
  "aspirador de po", "aspirador robo", "robo aspirador", "geladeira",
  "geladeira frost free", "geladeira inverter", "fogao", "fogao cooktop",
  "microondas", "micro-ondas", "maquina de lavar", "maquina lava e seca",
  "liquidificador", "climatizador", "ventilador", "ar condicionado",

  // MODA E BELEZA
  "vestido", "vestido festa", "blusa feminina", "calca feminina",
  "calca jeans", "tenis feminino", "tenis masculino", "tenis nike",
  "tenis adidas", "camisa masculina", "camiseta", "perfume",
  "perfume importado", "maquiagem", "bolsa feminina", "bolsa transversal",
  "relogio", "relogio masculino", "oculos de sol",

  // GAMES
  "ps5", "xbox series x", "nintendo switch oled", "jogo ps5",
  "jogo xbox", "controle xbox", "cadeira gamer",

  // INFORMATICA
  "ssd 1tb", "ssd nvme", "memoria ram 16gb", "placa mae", "fonte pc",
  "gabinete gamer", "teclado mecanico", "mouse gamer", "monitor 144hz",

  // INFANTIL
  "brinquedo", "boneca", "carrinho", "lego", "jogo tabuleiro",
];

// ═══════════════════════════════════════════════════════════
// QUALITY VALIDATION — política de qualidade ZERO TOLERÂNCIA
// Todo produto passa por aqui antes de ir para o banco.
// ═══════════════════════════════════════════════════════════

/** Hosts de imagem genéricos/placeholder — PROIBIDOS em produção */
const PLACEHOLDER_HOSTS = [
  'picsum.photos', 'unsplash.com', 'placeholder.com', 'placehold.co',
  'placehold.it', 'dummyimage.com', 'loremflickr.com', 'pexels.com',
  'pixabay.com', 'gravatar.com', 'pravatar.cc',
]

/** CDNs oficiais de imagem por loja — só estes passam */
const STORE_IMAGE_CDNS: Record<string, string[]> = {
  amazon: ['media-amazon.com', 'images-amazon.com'],
  mercadolivre: ['mlstatic.com'],
  magalu: ['mlcdn.com.br', 'magazineluiza.com.br', 'magazinevoce.com.br'],
  shopee: ['shopee.com.br', 'shopee.ph'],
}

/** Imagem nula/vazia/placeholder → true (rejeitar) */
export function isPlaceholderImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || imageUrl.trim().length < 10) return true
  try {
    const raw = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`
    const host = new URL(raw).hostname.toLowerCase()
    return PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return true // URL malformada também é rejeitada
  }
}

/** Imagem só é aceita se vier do CDN oficial da loja */
export function isAllowedStoreImage(store: string | null | undefined, imageUrl: string): boolean {
  if (isPlaceholderImageUrl(imageUrl)) return false
  try {
    const raw = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`
    const host = new URL(raw).hostname.toLowerCase()
    const cdns = STORE_IMAGE_CDNS[store || '']
    if (!cdns) return false // loja desconhecida → rejeita (zero tolerância)
    return cdns.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/**
 * URL canônica e direta do PRODUTO no marketplace.
 * Rejeita: URLs sintéticas (??), rotas de busca quebradas (/busca/,
 * /search), URLs malformadas.
 */
export function isCanonicalProductUrl(store: string | null | undefined, url: string | null | undefined): boolean {
  if (!url || !store) return false
  const u = url.toLowerCase()
  // Rejeições universais
  if (u.includes('??') || u.includes('/busca/') || u.includes('/search?') || u.includes('/search/')) return false

  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    return false
  }

  const host = parsed.hostname
  const path = parsed.pathname

  switch (store) {
    case 'amazon':
      return host.endsWith('amazon.com.br') && (/\/dp\//.test(path) || /\/gp\//.test(path))
    case 'mercadolivre':
      // /p/MLB..., slug de produto ou /up/MLBU... (todos são URLs reais
      // de produto emitidas pelo próprio ML)
      return host.endsWith('mercadolivre.com.br') && path.length > 1
    case 'magalu':
      // magazinevoce.com.br/magazine<loja>/<slug-do-produto>
      return host.endsWith('magazinevoce.com.br') && path.length > 1
    case 'shopee':
      // shopee.com.br/product/... ou short link oficial s.shopee.com.br
      return (host.endsWith('shopee.com.br') || host === 's.shopee.com.br') && path.length > 1
    default:
      return false
  }
}

export function validateOffer(offer: {
  title?: string; price?: number; originalPrice?: number;
  imageUrl?: string; url?: string; discountPct?: number; store?: string;
}): { valid: boolean; reason?: string } {
  // Titulo: minimo 10 caracteres
  if (!offer.title || offer.title.length < 10) {
    return { valid: false, reason: "titulo curto" };
  }
  // Preco: deve ser > 0
  if (!offer.price || offer.price <= 0) {
    return { valid: false, reason: "preco invalido" };
  }
  // Desconto maximo realista (evitar 100% OFF falso)
  if (offer.discountPct && offer.discountPct > 90) {
    return { valid: false, reason: "desconto suspeito" };
  }
  // Preco original deve ser maior que o atual (igual = sem desconto real,
  // permitido desde o Price Extraction Engine — descontos não são fabricados)
  if (offer.originalPrice && offer.originalPrice < offer.price) {
    return { valid: false, reason: "preco original inconsistente" };
  }
  // 🔒 URL: link direto e canônico do produto (sem /busca/, ??, search)
  if (!isCanonicalProductUrl(offer.store, offer.url)) {
    return { valid: false, reason: "url nao-canonica do produto" };
  }
  // 🔒 IMAGEM: nunca placeholder genérico — só CDN oficial da loja
  if (isPlaceholderImageUrl(offer.imageUrl)) {
    return { valid: false, reason: "imagem placeholder generica" };
  }
  if (!isAllowedStoreImage(offer.store, offer.imageUrl!)) {
    return { valid: false, reason: "imagem fora do CDN oficial da loja" };
  }
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════
// ENHANCED RANKING SCORE
// ═══════════════════════════════════════════════════════════

export function calculateEnhancedScore(params: {
  discountPct: number; freeShipping: boolean; isFlash?: boolean;
  isBestSeller?: boolean; salesCount?: number; rating?: number;
  hasCoupon?: boolean; isRecent?: boolean; imageQuality?: number;  // 0-1
  titleQuality?: number;  // 0-1
}): number {
  let score = 0;

  // Desconto (0-40 pts)
  if (params.discountPct >= 70) score += 40;
  else if (params.discountPct >= 50) score += 30;
  else if (params.discountPct >= 30) score += 20;
  else if (params.discountPct >= 15) score += 10;
  else if (params.discountPct >= 5) score += 5;

  // Selos promocionais
  if (params.isFlash) score += 35;
  if (params.isBestSeller) score += 40;
  if (params.hasCoupon) score += 25;
  if (params.freeShipping) score += 20;

  // Volume de vendas (0-40 pts)
  if (params.salesCount) {
    if (params.salesCount >= 50000) score += 40;
    else if (params.salesCount >= 10000) score += 25;
    else if (params.salesCount >= 1000) score += 15;
    else if (params.salesCount >= 100) score += 5;
  }

  // Avaliacao (0-15 pts)
  if (params.rating) {
    if (params.rating >= 4.8) score += 15;
    else if (params.rating >= 4.5) score += 10;
    else if (params.rating >= 4.0) score += 5;
    else if (params.rating < 3.0) score -= 10;  // penalidade
  }

  // Recencia (0-10 pts)
  if (params.isRecent) score += 10;

  // Qualidade dos dados (0-20 pts)
  score += Math.round((params.titleQuality || 0.5) * 10);
  score += Math.round((params.imageQuality || 0.5) * 10);

  return Math.max(0, score);
}

// ═══════════════════════════════════════════════════════════
// TERM MERGER — une termos existentes + promocionais + prioridade
// ═══════════════════════════════════════════════════════════

export function mergeSearchTerms(
  existingTerms: string[],
  options: { includePromo?: boolean; includePriority?: boolean } = {}
): string[] {
  const merged = new Set(existingTerms);

  if (options.includePromo !== false) {
    PROMOTIONAL_TERMS.forEach((t) => merged.add(t));
  }
  if (options.includePriority !== false) {
    PRIORITY_TERMS.forEach((t) => merged.add(t));
  }

  return Array.from(merged);
}

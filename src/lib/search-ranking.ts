/**
 * 🎯 SEARCH RANKING ENGINE — relevância de busca por categoria
 *
 * Regra de ouro para conversão:
 *   Celulares e TVs REAIS sempre no topo; capinhas, suportes, cabos,
 *   brinquedos e acessórios vão para o final.
 *
 * Centraliza a lógica que antes vivia só no /api/search (e só para a
 * query exata "celular") — agora reutilizada pela página /busca/[query],
 * pela API e por qualquer outra superfície.
 *
 * Este módulo é PURO (sem I/O) para ser testável.
 */

// ═══════════════════════════════════════════════════════════════════
// Vocabulários
// ═══════════════════════════════════════════════════════════════════

/** Palavras que indicam ACESSÓRIO/BRINQUEDO (demoted para o final) — com \b
 *  para não pegar "capacidade"→capa, "suporta"→suporte, etc. */
const ACCESSORY_WORDS_REGEX = /\b(cabo|capa|capinha|case|pelicula|película|carregador|suporte|adaptador|protecao|proteção|antena|brinquedo|fone|headphone|headset|ventosa|stylus|caneta|tripé|tripe|infantil|educativo|musical|luva|touca|gorro|cachecol|jumper|reparo|teclado|mouse|smartwatch|relógio|relogio|placa|microfone|lapela|compativel|compatível)\b/
const ACCESSORY_PHRASES = ['controle remoto', 'suporte de parede', 'cabo hdmi', 'capa para', 'pelicula para', 'tela magnetica', 'touch pen', 'luva touch', 'limpador celular', 'troca de tela', 'kit de ferramentas']

/** Marcas conhecidas para filtro/extraction de título */
export const KNOWN_BRANDS: { name: string; aliases: string[] }[] = [
  { name: 'Samsung', aliases: ['samsung', 'galaxy'] },
  { name: 'Apple', aliases: ['apple', 'iphone', 'ipad', 'airpods', 'macbook', 'watch se'] },
  { name: 'Xiaomi', aliases: ['xiaomi', 'redmi', 'poco'] },
  { name: 'Motorola', aliases: ['motorola', 'moto g', 'moto e', 'moto edge', 'razr'] },
  { name: 'LG', aliases: ['lg '] },
  { name: 'TCL', aliases: ['tcl'] },
  { name: 'Philips', aliases: ['philips'] },
  { name: 'AOC', aliases: ['aoc'] },
  { name: 'Philco', aliases: ['philco'] },
  { name: 'Semp', aliases: ['semp'] },
  { name: 'Realme', aliases: ['realme'] },
  { name: 'Asus', aliases: ['asus', 'rog phone', 'zenfone'] },
  { name: 'Lenovo', aliases: ['lenovo', 'motorola'] },
  { name: 'Dell', aliases: ['dell'] },
  { name: 'Acer', aliases: ['acer'] },
  { name: 'HP', aliases: ['hp '] },
  { name: 'Positivo', aliases: ['positivo'] },
  { name: 'Multilaser', aliases: ['multilaser'] },
  { name: 'Infinix', aliases: ['infinix'] },
  { name: 'Nokia', aliases: ['nokia'] },
]

/** Queries que indicam intenção de CELULAR/TV (para ativar o ranking) */
const PHONE_QUERIES = new Set([
  'celular', 'celulares', 'smartphone', 'smartphones', 'telefone',
  'iphone', 'samsung', 'galaxy', 'xiaomi', 'redmi', 'poco', 'motorola',
  'moto g', 'moto e', 'moto edge', 'realme', 'infinix', 'zenfone',
])

const TV_QUERIES = new Set([
  'tv', 'tvs', 'televisao', 'televisão', 'televisor', 'televisores',
  'smart tv', 'tv 4k', 'tv oled', 'tv qled', 'samsung tv', 'lg tv', 'tcl tv',
])

// ═══════════════════════════════════════════════════════════════════
// Detecção de categoria do produto (pelo título/categoriaSlug)
// ═══════════════════════════════════════════════════════════════════

export function isAccessory(title: string): boolean {
  const t = title.toLowerCase()
  if (ACCESSORY_WORDS_REGEX.test(t)) return true
  return ACCESSORY_PHRASES.some((p) => t.includes(p))
}

export function isRealPhone(title: string, categorySlug?: string): boolean {
  const t = title.toLowerCase()
  // Acessório NUNCA é aparelho real — mesmo citando "iphone" no título
  if (isAccessory(t)) return false
  // ⚠️ categorySlug NÃO é prova — o banco tem acessórios categorizados
  // como "celulares" (ex: Kit Ferramenta Reparos Celular). Categoria dá
  // bônus no score, mas a prova vem do TÍTULO.
  // Celular/Smartphone no INÍCIO do título = aparelho real
  if (t.startsWith('smartphone') || t.startsWith('celular')) return true
  // "smartphone"/"iphone" como palavra principal (não "para smartphone")
  if (/\bsmartphone\b/.test(t) && !t.includes('para smartphone') && !t.includes('para celular')) return true
  if (/\biphone\b/.test(t) && !t.includes('para iphone')) return true
  // Modelos explícitos no INÍCIO do título — acessórios citam modelos no fim
  // ("Luva Touch ... Galaxy" não é aparelho; "Galaxy A17 ..." é)
  const head = t.slice(0, 30)
  if (/\b(galaxy|redmi|poco|moto|razr|zenfone|rog|realme|infinix|xiaomi|oppo|oneplus|nokia|honor|vivo)\b/.test(head) && !t.includes('para ')) return true
  return false
}

export function isRealTV(title: string, categorySlug?: string): boolean {
  const t = title.toLowerCase()
  // Acessório NUNCA é TV real — mesmo com "TV 50 polegadas" no título
  if (isAccessory(t)) return false
  // ⚠️ categorySlug NÃO é prova (suportes podem estar em "tv" no banco)
  // TV no início = televisor real
  if (t.startsWith('tv ') || t.startsWith('smart tv') || t.startsWith('televis')) return true
  // "smart tv"/"tv 4k"/"oled"/"qled" no título (não "suporte para tv")
  if (/(smart tv|tv 4k|tv oled|tv qled|televisor|televisão|televisao)/.test(t) && !t.includes('para tv') && !t.includes('suporte')) return true
  // Polegadas + resolução = TV real
  if (/\b\d{2}"\b|\b\d{2} polegadas?\b|\b\d{2}\s?pol\b/.test(t) && /(4k|uhd|oled|qled|full hd|led|smart)/.test(t)) return true
  return false
}

// ═══════════════════════════════════════════════════════════════════
// Marcas
// ═══════════════════════════════════════════════════════════════════

/** Extrai a marca de um título (ou null se não reconhecida) */
export function extractBrand(title: string): string | null {
  const t = ` ${title.toLowerCase()} `
  for (const brand of KNOWN_BRANDS) {
    for (const alias of brand.aliases) {
      if (t.includes(alias)) return brand.name
    }
  }
  return null
}

/** Marcas presentes em uma lista de ofertas (para o painel de filtros) */
export function availableBrands(offers: Array<{ title: string }>): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const o of offers) {
    const brand = extractBrand(o.title)
    if (brand) counts.set(brand, (counts.get(brand) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
}

// ═══════════════════════════════════════════════════════════════════
// Sinônimos (motor de expansão de busca)
// ═══════════════════════════════════════════════════════════════════

export const SYNONYMS: Record<string, string[]> = {
  celular: ['smartphone', 'iphone', 'samsung galaxy', 'motorola', 'xiaomi', 'redmi', 'poco', 'moto g', 'moto edge', 'galaxy s', 'galaxy a'],
  tv: ['smart tv', 'qled', 'oled', 'led', 'samsung tv', 'lg tv', 'tcl', 'philips', 'aoc', '4k', 'televisao', 'televisão'],
  notebook: ['notebook gamer', 'laptop', 'dell', 'acer', 'lenovo', 'asus', 'vaio', 'ultrabook', 'macbook'],
  ps5: ['playstation', 'playstation 5', 'console sony'],
  'air fryer': ['fritadeira eletrica', 'fritadeira elétrica', 'fritadeira sem oleo', 'fritadeira sem óleo'],
  aspirador: ['robo aspirador', 'robô aspirador', 'aspirador de po', 'aspirador de pó'],
  cafeteira: ['cafeteira nespresso', 'cafeteira expresso', 'maquina de cafe', 'máquina de café'],
  geladeira: ['geladeira frost free', 'geladeira inverter', 'refrigerador'],
  tenis: ['tênis', 'tenis nike', 'tenis adidas', 'tenis casual', 'tenis esportivo'],
  perfume: ['perfume importado', 'perfume masculino', 'perfume feminino'],
  vestido: ['vestido festa', 'vestido casual', 'vestido longo'],
  fone: ['fone bluetooth', 'headphone', 'headset', 'airpods', 'fone de ouvido'],
  relogio: ['relógio', 'smartwatch', 'apple watch', 'relogio masculino', 'relógio masculino'],
  maquiagem: ['maquiagem', 'make', 'base', 'batom', 'sombra'],
}

export function getSynonyms(query: string): string[] {
  const term = query.toLowerCase().trim()
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (term === key || synonyms.some((s) => s.toLowerCase() === term)) {
      return [key, ...synonyms]
    }
  }
  return [query]
}

/**
 * Termos extras de MATCH para queries de celular/TV — garante que aparelhos
 * reais entrem no pool mesmo quando o usuário busca só "celular" ou "tv"
 * (sem isso, um pool ordenado por cliques deixa os aparelhos de fora).
 */
export function getIntentExpansion(query: string): string[] {
  const intent = detectIntent(query)
  if (intent === 'phone') {
    return ['smartphone', 'iphone', 'galaxy', 'redmi', 'moto g', 'moto e', 'xiaomi', 'realme', 'infinix', 'poco', 'zenfone']
  }
  if (intent === 'tv') {
    return ['smart tv', 'televisor', 'televisão', 'televisao', 'oled', 'qled', 'uhd', '4k', 'full hd', 'tv led', 'tv smart']
  }
  return []
}

/** Junta as palavras da query com os termos de expansão de intenção (sem duplicatas). */
export function getMatchTerms(query: string): string[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 1)
  const set = new Set([...words, ...getIntentExpansion(query)])
  return [...set]
}

// ═══════════════════════════════════════════════════════════════════
// Intenção de busca + score
// ═══════════════════════════════════════════════════════════════════

export type SearchIntent = 'phone' | 'tv' | 'generic'

export function detectIntent(query: string): SearchIntent {
  const q = query.toLowerCase().trim()
  if ([...PHONE_QUERIES].some((k) => q === k || q.startsWith(k + ' '))) return 'phone'
  if ([...TV_QUERIES].some((k) => q === k || q.startsWith(k + ' '))) return 'tv'
  return 'generic'
}

/**
 * Score de relevância de uma oferta para a query.
 * Quanto maior, mais relevante. Celulares/TVs reais ganham +100,
 * acessórios perdem -80 (vão para o final da lista).
 */
export function scoreOffer(offer: {
  title?: string
  categorySlug?: string
  discountPct?: number
  clicks?: number
}, query: string): number {
  let score = 0
  const t = (offer.title || '').toLowerCase()
  const cat = (offer.categorySlug || '').toLowerCase()
  const q = query.toLowerCase().trim()

  const intent = detectIntent(q)

  if (intent === 'phone') {
    if (isRealPhone(t, cat)) score += 100
    if (isAccessory(t)) score -= 80
    if (cat === 'celulares') score += 50
  }

  if (intent === 'tv') {
    if (isRealTV(t, cat)) score += 100
    if (isAccessory(t)) score -= 80
    if (cat === 'tv' || cat === 'tvs' || cat === 'eletronicos') score += 40
  }

  // Produto com a palavra exata no início do título
  if (t.startsWith(q)) score += 30
  // Contém a query como palavra inteira
  if (new RegExp(`\\b${escapeRegExp(q)}\\b`).test(t)) score += 15

  // Maior desconto = bônus moderado (não pode dominar o ranking)
  if ((offer.discountPct || 0) >= 20) score += 5

  // Mais cliques = mais relevante (limitado para não distorcer)
  score += Math.min(offer.clicks || 0, 50)

  return score
}

/**
 * Ordena ofertas por relevância (desc) com desempate por desconto.
 * NÃO muta a lista original.
 */
export function rankOffers<T extends {
  title?: string
  categorySlug?: string
  discountPct?: number
  clicks?: number
}>(offers: T[], query: string): T[] {
  return [...offers].sort((a, b) => {
    const sa = scoreOffer(a, query)
    const sb = scoreOffer(b, query)
    if (sb !== sa) return sb - sa
    return (b.discountPct || 0) - (a.discountPct || 0)
  })
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

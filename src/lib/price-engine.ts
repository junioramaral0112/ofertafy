/**
 * 💰 PRICE EXTRACTION ENGINE — camada centralizada de extração de preços
 *
 * Pipeline único e reutilizável por todos os scrapers (Amazon, ML, Shopee,
 * Magalu, Shein, TikTok):
 *
 *   extractMainProductPrice()
 *         ↓
 *   normalizeBrazilianPrice()   — converte texto BR → número decimal
 *         ↓
 *   rejectUnitPrice()           — descarta preço por kg / litro / 100g / unidade
 *         ↓
 *   rejectInstallmentPrice()    — descarta valor de parcela ("12x R$ 29,90")
 *         ↓
 *   validatePrice()             — sanidade (faixa, finitude, casas decimais)
 *         ↓
 *   price final
 *
 * REGRA FUNDAMENTAL: price = preço principal de compra do produto.
 * NUNCA: preço por kg/litro/100g/unidade, parcela, subtotal, economia,
 * preço de referência ou preço promocional secundário.
 *
 * Este módulo é PURO (sem I/O, sem dependências de Node) para ser testável.
 */

// ═══════════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════════

export interface PriceCandidate {
  /** Texto bruto com o número, ex: "R$ 3,39", "3.390,00", "1899.00" */
  text: string
  /** Texto ao redor (bloco/elemento pai) — usado para detectar "/kg", "12x", "De R$" */
  context?: string
  /** Dica do scraper sobre o papel do candidato */
  role?: 'main' | 'original' | 'unknown'
  /** Origem para debug, ex: 'amazon .a-price#2', 'ml current_price' */
  source?: string
}

export type RejectReason = 'unit' | 'installment' | 'invalid' | 'percent'

export interface PricePair {
  /** Preço principal de compra (nunca por kg/litro/parcela) */
  price: number | null
  /** Preço original real (riscado / "De") — igual a price quando não existe */
  originalPrice: number | null
  /** Desconto calculado do par real (0 quando não há desconto real) */
  discountPct: number
  /** Candidatos rejeitados (para auditoria/debug) */
  rejected: { text: string; reason: RejectReason; source?: string }[]
  /** Candidato escolhido como preço principal */
  priceSource?: string
  /** Candidato escolhido como preço original */
  originalSource?: string
}

export interface PriceAudit {
  suspicious: boolean
  reasons: string[]
}

// ═══════════════════════════════════════════════════════════════════
// Limites de sanidade (BRL)
// ═══════════════════════════════════════════════════════════════════

export const MIN_PRICE = 0.01
export const MAX_PRICE = 500000

// ═══════════════════════════════════════════════════════════════════
// NORMALIZAÇÃO BRASILEIRA
// ═══════════════════════════════════════════════════════════════════

/** Encontra o maior número "precificável" em um texto livre. */
export function extractPriceNumber(text: string): { match: string; index: number; length: number } | null {
  if (!text) return null
  const re = /\d[\d.,]*/g
  let best: { match: string; index: number; length: number } | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (!best || m[0].length > best.match.length) {
      best = { match: m[0], index: m.index, length: m[0].length }
    }
  }
  return best
}

/**
 * Converte string de preço brasileira para número decimal.
 * Ex: "R$ 8.890,00" → 8890 | "R$ 1.162,99" → 1162.99
 *     "8.890" → 8890 | "44,90" → 44.9 | "10.50" → 10.5
 *     "1.299.90" → 1299.9 | "R$ 17.900,00" → 17900
 */
export function normalizeBrazilianPrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0
  const found = extractPriceNumber(priceStr)
  if (!found) return 0

  let cleanStr = found.match

  const hasComma = cleanStr.includes(',')
  const dots = cleanStr.split('.').length - 1

  if (hasComma && dots > 0) {
    // "2.399,00" → remove milhar, vírgula vira decimal
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.')
  } else if (hasComma && dots === 0) {
    // "49,90" → decimal
    cleanStr = cleanStr.replace(',', '.')
  } else if (dots >= 2) {
    // "1.299.90" → último ponto é decimal, anteriores são milhar
    const parts = cleanStr.split('.')
    const decimals = parts.pop()!
    cleanStr = parts.join('') + '.' + decimals
  } else if (dots === 1) {
    // "2.399" → 3 dígitos após o ponto = milhar | "10.5" / "99.99" = decimal
    const parts = cleanStr.split('.')
    if (parts[1] && parts[1].length === 3 && !parts[1].startsWith('0')) {
      cleanStr = cleanStr.replace(/\./g, '')
    }
  }

  const finalPrice = parseFloat(cleanStr)
  if (isNaN(finalPrice) || !isFinite(finalPrice)) return 0
  return Math.round(finalPrice * 100) / 100
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO (unit / installment / main / original)
// ═══════════════════════════════════════════════════════════════════

const WINDOW = 30 // caracteres de contexto antes/depois do número

// Indicador de unidade DIRETAMENTE colado após o número
// (ex: "R$ 3.390,00/kg", " / kg)", " por 100g", " x unidade")
const UNIT_SLASH_AFTER = /^\s*[) ]*\s*\/\s*(kg|kilo|quilo|gramas?|g|l|litros?|ml|un|und|unid|unidades?)\b/i
const UNIT_POR_AFTER = /^\s*[) ]*\bpor\s+(kg|kilo|quilo|gramas?|g|l|litros?|ml|100\s?g|100\s?ml|un|und|unid|unidades?)\b/i
const UNIT_X_AFTER = /^\s*[x/]\s*(unidade|unidades|und|unid|un)\b/i
const UNIT_100_AFTER = /^\s*(g|ml)\b/i // "100" seguido de g/ml → "100g"/"100 ml"

// Indicador de unidade imediatamente ANTES do número ("preço por kg: R$ 5,00")
const UNIT_POR_BEFORE = /\bpor\s+(kg|kilo|quilo|gramas?|g|l|litros?|ml|100\s?g|100\s?ml|un|und|unid|unidades?)\s*:?\s*$/i

const INSTALL_BEFORE = /(?:^|[\s(])(\d{1,2})x\s*(?:de\s*)?R\$\s*$/i
const INSTALL_ATE_BEFORE = /\bem\s+at[eé]\s+\d{1,2}x\s+(?:de\s*)?R\$\s*$/i
const DE_BEFORE = /(?:^|[\s(])de\s+R\$\s*$/i
const POR_BEFORE = /(?:^|[\s(])(?:por|apenas)\s+R\$\s*$/i
const ECONOMY_BEFORE = /\b(economize|save|poupe|voc[êe]\s+economiza)\b/i
const INSTALL_COUNT_AFTER = /^[\s) ]*x\b/ // número "12" de "12x R$ ..."
const PERCENT_DIRECT_AFTER = /^[\s) ]*%/

/**
 * Constroi janelas posicionais ancoradas no número do candidato DENTRO do
 * contexto. Duas ancoragens diferentes de propósito:
 *  - before: primeira ocorrência (marcadores "De R$"/"Por R$"/"12x" vêm antes)
 *  - after:  ÚLTIMA ocorrência (o indicador de unidade "/kg" vem colado na
 *    última repetição do número no bloco — ex: "R$ 3.390,00R$3.390,00/kg")
 */
function buildWindows(
  text: string,
  context?: string
): { match: string; before: string; after: string; lastAfter: string } | null {
  const haystack = context || text
  const found = extractPriceNumber(text)
  if (!found) return null

  const firstIdx = haystack.indexOf(found.match)
  const nStart = firstIdx >= 0 ? firstIdx : 0
  const nEnd = firstIdx >= 0 ? firstIdx + found.match.length : found.match.length

  // Última ocorrência do número no contexto
  const lastIdx = haystack.lastIndexOf(found.match)
  const lastEnd = lastIdx >= 0 ? lastIdx + found.match.length : nEnd

  return {
    match: found.match,
    before: haystack.slice(Math.max(0, nStart - WINDOW), nStart),
    after: haystack.slice(nEnd, nEnd + WINDOW),
    lastAfter: haystack.slice(lastEnd, lastEnd + WINDOW),
  }
}

/** Detecta se o número representa preço POR UNIDADE DE MEDIDA (kg, L, 100g, un). */
export function isUnitPrice(text: string, context?: string): boolean {
  const win = buildWindows(text, context)
  if (!win) return false

  // Indicadores colados DEPOIS do número (na última ocorrência — o preço
  // por unidade repete o número e termina com "/kg", "/L", "por 100g"...)
  if (UNIT_SLASH_AFTER.test(win.lastAfter)) return true
  if (UNIT_POR_AFTER.test(win.lastAfter)) return true
  if (UNIT_X_AFTER.test(win.lastAfter)) return true
  if (UNIT_100_AFTER.test(win.lastAfter) && /^100$/.test(win.match)) return true
  // Indicadores ANTES do número ("preço por kg: R$ 5,00")
  if (UNIT_POR_BEFORE.test(win.before)) return true
  return false
}

/** Detecta se o número é valor de PARCELA ("12x de R$ 89,90"). */
export function isInstallmentPrice(text: string, context?: string): boolean {
  const win = buildWindows(text, context)
  if (!win) return false

  // "Nx de R$"/"Nx R$" imediatamente antes do número
  if (INSTALL_BEFORE.test(win.before)) return true
  if (INSTALL_ATE_BEFORE.test(win.before)) return true
  // O próprio número é a CONTAGEM de parcelas ("12x R$ 89,90" → o "12"):
  // seguido de "x" sem ser um valor monetário (antes não termina em R$)
  if (INSTALL_COUNT_AFTER.test(win.after) && !/R\$\s*$/.test(win.before)) return true
  return false
}

/**
 * Classifica um candidato completo (número + contexto) como
 * main / original / unknown — rejeitando unit/installment.
 */
export function classifyPriceCandidate(
  text: string,
  context?: string
): { role: 'main' | 'original' | 'unknown'; reject?: RejectReason } {
  const win = buildWindows(text, context)
  if (!win) return { role: 'unknown', reject: 'invalid' }

  if (isUnitPrice(text, context)) return { role: 'unknown', reject: 'unit' }
  if (isInstallmentPrice(text, context)) return { role: 'unknown', reject: 'installment' }

  // Texto de economia ("(3%)" colado no número) → não é preço
  if (PERCENT_DIRECT_AFTER.test(win.lastAfter)) return { role: 'unknown', reject: 'percent' }

  // "Economize R$ X" → texto de economia, não é preço de compra
  if (ECONOMY_BEFORE.test(win.before)) return { role: 'unknown', reject: 'percent' }

  // Marcadores "De R$ X" / "Por R$ Y"
  if (DE_BEFORE.test(win.before)) return { role: 'original' }
  if (POR_BEFORE.test(win.before)) return { role: 'main' }

  return { role: 'unknown' }
}

// ═══════════════════════════════════════════════════════════════════
// VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════

export function validatePrice(price: number): { valid: boolean; reason?: string } {
  if (!isFinite(price) || isNaN(price)) return { valid: false, reason: 'não-numérico' }
  if (price < MIN_PRICE) return { valid: false, reason: 'abaixo do mínimo' }
  if (price > MAX_PRICE) return { valid: false, reason: 'acima do máximo' }
  return { valid: true }
}

/**
 * Auditoria de par (price, originalPrice) — usada na extração E na
 * auditoria do banco. Detecta sinais de preço por unidade vazado,
 * desconto absurdo e inconsistências.
 */
export function auditPricePair(price: number, originalPrice: number): PriceAudit {
  const reasons: string[] = []

  if (!isFinite(price) || price <= 0) reasons.push('price inválido (<= 0)')
  if (price > MAX_PRICE) reasons.push(`price > ${MAX_PRICE}`)
  if (originalPrice < price) reasons.push('originalPrice < price (inconsistente)')
  if (originalPrice > price * 1000) reasons.push('originalPrice > 1000x price (possível preço por unidade vazado)')
  if (originalPrice > price && (originalPrice - price) / originalPrice > 0.95) {
    reasons.push('desconto > 95% (suspeito)')
  }
  // Preço fora de 2 casas decimais (ex: 29.8999999 sugere parcela)
  if (Math.abs(price - Math.round(price * 100) / 100) > 0.001) reasons.push('price fora de 2 casas decimais')

  return { suspicious: reasons.length > 0, reasons }
}

// ═══════════════════════════════════════════════════════════════════
// PIPELINE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

interface NormalizedCandidate {
  text: string
  context?: string
  role: 'main' | 'original' | 'unknown'
  value: number
  source?: string
}

/**
 * Ponto de entrada do engine.
 *
 * Recebe candidatos (textos de preço + contexto) na ordem de captura do
 * DOM/API e retorna o par final (price, originalPrice) já validado.
 *
 * Regras de seleção:
 *  1. Rejeita candidatos de preço por unidade (kg/L/100g/un).
 *  2. Rejeita candidatos de parcela (12x R$).
 *  3. price = primeiro candidato 'main' (dica explícita ou "Por R$");
 *     senão o MENOR entre os 'unknown' (nunca o maior — maior tende a
 *     ser preço de referência/por unidade).
 *  4. originalPrice = primeiro 'original' ("De R$"/riscado) maior que
 *     price; senão o MAIOR entre os 'unknown' maiores que price; senão
 *     null (não fabricamos desconto falso).
 */
export function extractMainProductPrice(candidates: PriceCandidate[]): PricePair {
  const rejected: PricePair['rejected'] = []
  const normalized: NormalizedCandidate[] = []

  for (const c of candidates) {
    const value = normalizeBrazilianPrice(c.text)
    if (value <= 0) {
      rejected.push({ text: c.text, reason: 'invalid', source: c.source })
      continue
    }

    const v = validatePrice(value)
    if (!v.valid) {
      rejected.push({ text: c.text, reason: 'invalid', source: c.source })
      continue
    }

    const cls = classifyPriceCandidate(c.text, c.context)
    if (cls.reject) {
      rejected.push({ text: c.text, reason: cls.reject, source: c.source })
      continue
    }

    const role = c.role && c.role !== 'unknown' ? c.role : cls.role
    normalized.push({ text: c.text, context: c.context, role, value, source: c.source })
  }

  // ── Preço principal ──
  const mains = normalized.filter((n) => n.role === 'main')
  const unknowns = normalized.filter((n) => n.role === 'unknown')

  let price: number | null = null
  let priceSource: string | undefined

  if (mains.length > 0) {
    price = mains[0].value
    priceSource = mains[0].source
  } else if (unknowns.length > 0) {
    // Menor valor plausível — nunca o maior (defesa contra preço por unidade
    // que escape da classificação)
    const min = unknowns.reduce((a, b) => (b.value < a.value ? b : a))
    price = min.value
    priceSource = min.source
  }

  if (price === null) {
    return { price: null, originalPrice: null, discountPct: 0, rejected }
  }

  // ── Preço original (só se for REAL e maior que o atual) ──
  const originals = normalized.filter((n) => n.role === 'original' && n.value > price!)
  let originalPrice: number | null = null
  let originalSource: string | undefined

  if (originals.length > 0) {
    originalPrice = originals[0].value
    originalSource = originals[0].source
  } else {
    const biggerUnknowns = unknowns.filter((n) => n.value > price!)
    if (biggerUnknowns.length > 0) {
      const max = biggerUnknowns.reduce((a, b) => (b.value > a.value ? b : a))
      originalPrice = max.value
      originalSource = max.source
    }
  }

  return sanitizePricePair(price, originalPrice, { priceSource, originalSource, rejected })
}

/**
 * Finaliza um par numérico (já extraído por scraper estruturado),
 * aplicando a mesma validação. NÃO fabrica desconto: se não há preço
 * original real, originalPrice = price e discountPct = 0.
 */
export function sanitizePricePair(
  price: number,
  originalPrice: number | null,
  extra?: Partial<Pick<PricePair, 'priceSource' | 'originalSource' | 'rejected'>>
): PricePair {
  let finalPrice = price
  let finalOriginal = originalPrice

  const v = validatePrice(finalPrice)
  if (!v.valid) {
    return {
      price: null,
      originalPrice: null,
      discountPct: 0,
      rejected: extra?.rejected || [{ text: String(price), reason: 'invalid' }],
    }
  }

  finalPrice = Math.round(finalPrice * 100) / 100

  if (finalOriginal === null || !isFinite(finalOriginal) || finalOriginal <= finalPrice) {
    // Sem desconto real — nunca fabricar (o 1.3x/1.35x antigo criava
    // descontos falsos e poluía o ranking de ofertas)
    finalOriginal = finalPrice
  } else {
    finalOriginal = Math.round(finalOriginal * 100) / 100
  }

  const discountPct =
    finalOriginal > finalPrice
      ? Math.round(((finalOriginal - finalPrice) / finalOriginal) * 100)
      : 0

  return {
    price: finalPrice,
    originalPrice: finalOriginal,
    discountPct,
    rejected: extra?.rejected || [],
    priceSource: extra?.priceSource,
    originalSource: extra?.originalSource,
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXTRATOR DE TEXTO LIVRE (fallback genérico)
// ═══════════════════════════════════════════════════════════════════

/**
 * Extrai o par de preços de um texto livre (ex: bloco inteiro do card),
 * usando janelas de contexto ao redor de cada número.
 * Útil para scrapers que não conseguem isolar elementos de preço.
 */
export function extractPricesFromFreeText(freeText: string): PricePair {
  if (!freeText) return { price: null, originalPrice: null, discountPct: 0, rejected: [] }

  const candidates: PriceCandidate[] = []
  const re = /\d[\d.,]*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(freeText)) !== null) {
    const before = freeText.slice(Math.max(0, m.index - WINDOW), m.index)
    const after = freeText.slice(m.index + m[0].length, m.index + m[0].length + WINDOW)
    candidates.push({
      text: m[0],
      context: before + m[0] + after,
      role: 'unknown',
      source: 'free-text',
    })
  }

  return extractMainProductPrice(candidates)
}

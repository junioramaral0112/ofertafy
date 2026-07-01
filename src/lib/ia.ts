/**
 * 🧠 IA DO OFERTAFY — Módulo de Inteligência Artificial
 *
 * Sprint 3: Índice Ofertafy, detector de falso desconto,
 * análise de histórico de preços e recomendação de compra.
 *
 * Todos os algoritmos são baseados exclusivamente em dados
 * objetivos disponíveis no banco. Nenhuma "alucinação".
 */

import type { OfferData, PriceHistoryData } from '@/types'

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

export interface IndiceOfertafy {
  score: number        // 0-100
  factors: Factor[]
  summary: string      // resumo legível
  recommendation: Recommendation
}

export interface Factor {
  name: string
  score: number        // 0-100
  weight: number       // peso no cálculo final
  detail: string
}

export type Recommendation =
  | 'buy_now'       // ✔ Comprar agora
  | 'good_deal'     // 👍 Boa oferta
  | 'wait'          // ⚠ Aguarde
  | 'avoid'         // ❌ Não recomendado

export interface FakeDiscountResult {
  isFake: boolean
  confidence: number   // 0-100
  reason: string
  originalAvgPrice: number | null
  inflatedPct: number  // quanto o preço "original" foi inflado
}

export interface PriceAnalysis {
  min: number
  max: number
  avg: number
  current: number
  trend: 'falling' | 'rising' | 'stable'
  trendPct: number       // variação percentual na tendência
  daysTracked: number
  belowAverage: boolean
}

// ═══════════════════════════════════════════════════════════
// REPUTAÇÃO DAS LOJAS (curadoria baseada em dados públicos)
// ═══════════════════════════════════════════════════════════

const STORE_REPUTATION: Record<string, number> = {
  mercadolivre: 82,   // Maior marketplace, bom suporte
  magalu: 78,         // Rede consolidada, logística própria
  amazon: 85,         // Política de devolução forte
  shopee: 65,         // Marketplace asiático, entrega mais lenta
  tiktok: 50,         // Novo, pouca reputação de e-commerce
}

// ═══════════════════════════════════════════════════════════
// ÍNDICE OFERTAFY (0-100)
// ═══════════════════════════════════════════════════════════

/**
 * Calcula o Índice Ofertafy para uma oferta.
 *
 * Fatores considerados (com pesos):
 * - Desconto percentual (30%)
 * - Popularidade / cliques (20%)
 * - Frete grátis (10%)
 * - Reputação da loja (10%)
 * - Tendência de preço (15%)
 * - Preço abaixo da média histórica (15%)
 *
 * O algoritmo é modular — novos fatores podem ser
 * adicionados sem quebrar os existentes.
 */
export function calculateIndiceOfertafy(
  offer: OfferData,
  priceHistory?: PriceHistoryData[],
): IndiceOfertafy {
  const factors: Factor[] = []

  // ── Fator 1: Desconto percentual (peso 30) ──────
  factors.push(evaluateDiscount(offer))

  // ── Fator 2: Popularidade (peso 20) ─────────────
  factors.push(evaluatePopularity(offer))

  // ── Fator 3: Frete grátis (peso 10) ─────────────
  factors.push(evaluateShipping(offer))

  // ── Fator 4: Reputação da loja (peso 10) ────────
  factors.push(evaluateStoreReputation(offer))

  // ── Fator 5: Tendência de preço (peso 15) ───────
  factors.push(evaluatePriceTrend(offer, priceHistory))

  // ── Fator 6: Preço vs Média (peso 15) ───────────
  factors.push(evaluatePriceVsAverage(offer, priceHistory))

  // ── Cálculo ponderado ────────────────────────────
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0)
  const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0)
  const score = Math.round(weightedSum / totalWeight)

  // ── Recomendação ─────────────────────────────────
  const recommendation = getRecommendation(score)

  return {
    score: Math.min(100, Math.max(0, score)),
    factors,
    summary: generateSummary(score, factors),
    recommendation,
  }
}

// ═══════════════════════════════════════════════════════════
// AVALIADORES INDIVIDUAIS (FACTORS)
// ═══════════════════════════════════════════════════════════

function evaluateDiscount(offer: OfferData): Factor {
  const pct = offer.discountPct

  let score: number
  let detail: string

  if (pct >= 80) {
    score = 100
    detail = 'Desconto excepcional (80%+)'
  } else if (pct >= 60) {
    score = 90
    detail = `Desconto muito alto (${pct}%)`
  } else if (pct >= 40) {
    score = 80
    detail = `Desconto alto (${pct}%)`
  } else if (pct >= 25) {
    score = 65
    detail = `Desconto bom (${pct}%)`
  } else if (pct >= 15) {
    score = 45
    detail = `Desconto moderado (${pct}%)`
  } else if (pct >= 5) {
    score = 25
    detail = `Desconto baixo (${pct}%)`
  } else {
    score = 5
    detail = 'Sem desconto significativo'
  }

  return { name: 'Desconto', score, weight: 30, detail }
}

function evaluatePopularity(offer: OfferData): Factor {
  const clicks = offer.clicks || 0

  let score: number
  let detail: string

  if (clicks >= 100) {
    score = 100
    detail = `Muito popular (${clicks} acessos)`
  } else if (clicks >= 50) {
    score = 80
    detail = `Popular (${clicks} acessos)`
  } else if (clicks >= 20) {
    score = 60
    detail = `Boa procura (${clicks} acessos)`
  } else if (clicks >= 5) {
    score = 35
    detail = `Poucos acessos (${clicks})`
  } else {
    score = 15
    detail = 'Produto novo ou pouco acessado'
  }

  return { name: 'Popularidade', score, weight: 20, detail }
}

function evaluateShipping(offer: OfferData): Factor {
  if (offer.freeShipping) {
    return { name: 'Frete', score: 100, weight: 10, detail: 'Frete grátis' }
  }
  return { name: 'Frete', score: 20, weight: 10, detail: 'Frete não incluso' }
}

function evaluateStoreReputation(offer: OfferData): Factor {
  const reputation = STORE_REPUTATION[offer.store] || 50
  return {
    name: 'Loja',
    score: reputation,
    weight: 10,
    detail: `${offer.storeLabel} (nota ${reputation}/100)`,
  }
}

function evaluatePriceTrend(
  offer: OfferData,
  history?: PriceHistoryData[],
): Factor {
  if (!history || history.length < 2) {
    return { name: 'Tendência', score: 50, weight: 15, detail: 'Dados insuficientes para tendência' }
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime(),
  )

  const firstPrice = sorted[0].price
  const lastPrice = sorted[sorted.length - 1].price

  if (firstPrice === 0) {
    return { name: 'Tendência', score: 50, weight: 15, detail: 'Dados de referência indisponíveis' }
  }

  const changePct = ((lastPrice - firstPrice) / firstPrice) * 100

  if (changePct < -10) {
    return {
      name: 'Tendência',
      score: 95,
      weight: 15,
      detail: `Preço caindo (${Math.abs(changePct).toFixed(0)}% ↓ em ${sorted.length} verificações)`,
    }
  }
  if (changePct < -5) {
    return {
      name: 'Tendência',
      score: 75,
      weight: 15,
      detail: `Leve queda (${Math.abs(changePct).toFixed(0)}% ↓)`,
    }
  }
  if (changePct > 10) {
    return {
      name: 'Tendência',
      score: 20,
      weight: 15,
      detail: `Preço subindo (${changePct.toFixed(0)}% ↑) — talvez não seja o momento`,
    }
  }
  if (changePct > 5) {
    return {
      name: 'Tendência',
      score: 40,
      weight: 15,
      detail: `Leve alta (${changePct.toFixed(0)}% ↑)`,
    }
  }

  return {
    name: 'Tendência',
    score: 60,
    weight: 15,
    detail: 'Preço estável',
  }
}

function evaluatePriceVsAverage(
  offer: OfferData,
  history?: PriceHistoryData[],
): Factor {
  if (!history || history.length < 2) {
    return { name: 'Preço vs Média', score: 50, weight: 15, detail: 'Dados insuficientes' }
  }

  const avg = history.reduce((s, h) => s + h.price, 0) / history.length

  if (avg === 0) {
    return { name: 'Preço vs Média', score: 50, weight: 15, detail: 'Sem referência' }
  }

  const belowPct = ((avg - offer.price) / avg) * 100

  if (belowPct > 20) {
    return {
      name: 'Preço vs Média',
      score: 100,
      weight: 15,
      detail: `${belowPct.toFixed(0)}% abaixo da média histórica (R$ ${avg.toFixed(2)})`,
    }
  }
  if (belowPct > 10) {
    return {
      name: 'Preço vs Média',
      score: 80,
      weight: 15,
      detail: `${belowPct.toFixed(0)}% abaixo da média`,
    }
  }
  if (belowPct > 0) {
    return {
      name: 'Preço vs Média',
      score: 60,
      weight: 15,
      detail: `Ligeiramente abaixo da média`,
    }
  }
  if (belowPct > -10) {
    return {
      name: 'Preço vs Média',
      score: 35,
      weight: 15,
      detail: `Próximo da média histórica`,
    }
  }

  return {
    name: 'Preço vs Média',
    score: 15,
    weight: 15,
    detail: `${Math.abs(belowPct).toFixed(0)}% acima da média — caro`,
  }
}

// ═══════════════════════════════════════════════════════════
// RECOMENDAÇÃO
// ═══════════════════════════════════════════════════════════

function getRecommendation(score: number): Recommendation {
  if (score >= 80) return 'buy_now'
  if (score >= 60) return 'good_deal'
  if (score >= 35) return 'wait'
  return 'avoid'
}

function generateSummary(score: number, factors: Factor[]): string {
  const topFactors = factors
    .filter((f) => f.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (score >= 80) {
    const reasons = topFactors.map((f) => f.detail.toLowerCase()).join('; ')
    return `Excelente oportunidade de compra. ${reasons}.`
  }
  if (score >= 60) {
    return 'Boa oferta. Vale a pena considerar a compra.'
  }
  if (score >= 35) {
    return 'Oferta razoável. Monitore o preço por alguns dias.'
  }
  return 'Não recomendamos esta oferta no momento. O preço está acima da média.'
}

// ═══════════════════════════════════════════════════════════
// DETECTOR DE FALSO DESCONTO
// ═══════════════════════════════════════════════════════════

/**
 * Detecta se o "desconto" é artificial (preço original inflado).
 *
 * Heurísticas:
 * 1. Se o preço atual NUNCA foi registrado abaixo do "original"
 *    nos últimos 30 dias e o desconto é > 30% → suspeito
 * 2. Se o preço original é > 2x a média histórica → inflado
 * 3. Se o desconto é > 40% mas o preço atual está acima da média → falso
 */
export function detectFakeDiscount(
  offer: OfferData,
  history?: PriceHistoryData[],
): FakeDiscountResult {
  // Sem histórico → não podemos afirmar nada
  if (!history || history.length < 3) {
    return {
      isFake: false,
      confidence: 0,
      reason: 'Dados insuficientes para verificação.',
      originalAvgPrice: null,
      inflatedPct: 0,
    }
  }

  const avgPrice = history.reduce((s, h) => s + h.price, 0) / history.length
  const discounts = offer.discountPct

  // Regra 1: desconto > 40% mas preço igual ou acima da média
  if (discounts >= 40 && offer.price >= avgPrice) {
    return {
      isFake: true,
      confidence: 80,
      reason: `O desconto de ${discounts}% parece inflado — o preço atual (R$ ${offer.price.toFixed(2)}) está acima da média histórica (R$ ${avgPrice.toFixed(2)}).`,
      originalAvgPrice: avgPrice,
      inflatedPct: Math.round(((offer.originalPrice - avgPrice) / avgPrice) * 100),
    }
  }

  // Regra 2: preço original > 2x a média histórica
  if (offer.originalPrice > avgPrice * 2) {
    return {
      isFake: true,
      confidence: 65,
      reason: `O preço "original" (R$ ${offer.originalPrice.toFixed(2)}) é mais que o dobro da média histórica (R$ ${avgPrice.toFixed(2)}). Possível inflação artificial.`,
      originalAvgPrice: avgPrice,
      inflatedPct: Math.round(((offer.originalPrice - avgPrice) / avgPrice) * 100),
    }
  }

  // Regra 3: desconto > 30% com preço subindo
  if (discounts >= 30 && history.length >= 5) {
    const recent = history.slice(-3)
    const recentAvg = recent.reduce((s, h) => s + h.price, 0) / recent.length
    if (recentAvg > avgPrice * 1.1) {
      return {
        isFake: true,
        confidence: 55,
        reason: `Tendência de alta recente (+${Math.round(((recentAvg - avgPrice) / avgPrice) * 100)}%) com desconto de ${discounts}%. Verifique se o desconto é real.`,
        originalAvgPrice: avgPrice,
        inflatedPct: Math.round(((offer.originalPrice - avgPrice) / avgPrice) * 100),
      }
    }
  }

  return {
    isFake: false,
    confidence: 70,
    reason: 'O desconto parece legítimo com base no histórico.',
    originalAvgPrice: avgPrice,
    inflatedPct: 0,
  }
}

// ═══════════════════════════════════════════════════════════
// ANÁLISE DE PREÇO
// ═══════════════════════════════════════════════════════════

export function analyzePriceHistory(history: PriceHistoryData[]): PriceAnalysis {
  if (!history || history.length === 0) {
    return {
      min: 0, max: 0, avg: 0, current: 0,
      trend: 'stable', trendPct: 0, daysTracked: 0,
      belowAverage: false,
    }
  }

  const prices = history.map((h) => h.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length
  const current = prices[prices.length - 1]
  const daysTracked = history.length

  // Tendência: comparar primeira metade vs segunda metade
  const mid = Math.floor(prices.length / 2)
  const firstHalf = prices.slice(0, mid)
  const secondHalf = prices.slice(mid)
  const firstAvg = firstHalf.reduce((s, p) => s + p, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, p) => s + p, 0) / secondHalf.length

  let trend: PriceAnalysis['trend'] = 'stable'
  let trendPct = 0

  if (firstAvg > 0) {
    trendPct = ((secondAvg - firstAvg) / firstAvg) * 100
    if (trendPct < -5) trend = 'falling'
    else if (trendPct > 5) trend = 'rising'
    else trend = 'stable'
  }

  return {
    min, max, avg, current,
    trend, trendPct: Math.round(trendPct * 10) / 10,
    daysTracked,
    belowAverage: current < avg,
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT DE CONSTANTES
// ═══════════════════════════════════════════════════════════

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  buy_now: '✔ Comprar agora',
  good_deal: '👍 Boa oferta',
  wait: '⚠ Aguarde uma promoção melhor',
  avoid: '❌ Não recomendado',
}

export const RECOMMENDATION_COLORS: Record<Recommendation, string> = {
  buy_now: 'text-green-600 bg-green-50 border-green-200',
  good_deal: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  wait: 'text-amber-600 bg-amber-50 border-amber-200',
  avoid: 'text-red-600 bg-red-50 border-red-200',
}

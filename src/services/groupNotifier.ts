/**
 * 📢 DISPARADOR AUTOMÁTICO DE OFERTAS
 *
 * Seleciona 3 ofertas do banco (1 de cada loja diferente),
 * formata uma mensagem atrativa e envia via webhook.
 *
 * Lojas no rodízio:
 *   - Oferta 1: Mercado Livre OU Magalu
 *   - Oferta 2: Shopee OU Amazon
 *   - Oferta 3: a loja restante com maior desconto
 *
 * Webhook compatível com:
 *   - WhatsApp (Evolution API, Z-API, WPPConnect)
 *   - Telegram Bot API
 *   - Discord Webhook
 *   - Qualquer endpoint que aceite { text: string }
 */

import { prisma } from '@/lib/prisma'
import { formatPrice, getBridgeUrl } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Lojas usadas no disparo diário */
const STORE_GROUPS: string[][] = [
  ['mercadolivre', 'magalu'],      // Grupo A: marketplaces Brasil
  ['shopee', 'amazon'],            // Grupo B: marketplaces globais
  ['shein'],                       // Grupo C: moda
]

/** Emojis por loja para deixar a mensagem visual */
const STORE_EMOJI: Record<string, string> = {
  mercadolivre: '🟡',
  magalu: '🔵',
  shopee: '🔴',
  amazon: '🟠',
  shein: '👗',
}

const STORE_LABELS: Record<string, string> = {
  mercadolivre: 'Mercado Livre',
  magalu: 'Magalu',
  shopee: 'Shopee',
  amazon: 'Amazon',
  shein: 'SHEIN',
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface DailyOffer {
  title: string
  price: number
  originalPrice: number
  discountPct: number
  store: string
  storeLabel: string
  url: string
  freeShipping: boolean
  installment: string | null
}

export interface DispatchResult {
  success: boolean
  message: string
  offers: DailyOffer[]
  webhookResponse?: string
}

// ---------------------------------------------------------------------------
// Seleção de ofertas
// ---------------------------------------------------------------------------

/**
 * Busca as melhores ofertas do banco garantindo lojas diferentes.
 *
 * Estratégia:
 *   1. Do Grupo A (ML ou Magalu): pega a de MAIOR desconto
 *   2. Do Grupo B (Shopee ou Amazon): pega a de MAIOR desconto
 *   3. Terceira oferta: MAIOR desconto entre as lojas não escolhidas
 */
export async function prepareDailyOffers(): Promise<DailyOffer[]> {
  const selected: DailyOffer[] = []
  const usedStores = new Set<string>()

  // ── Oferta 1: Grupo A (ML ou Magalu) ──────────────────────
  const groupAOffer = await prisma.offer.findFirst({
    where: {
      store: { in: STORE_GROUPS[0] },
      price: { gt: 0 },
      discountPct: { gte: 15 },
    },
    orderBy: { discountPct: 'desc' },
  })

  if (groupAOffer) {
    selected.push(mapOffer(groupAOffer))
    usedStores.add(groupAOffer.store)
  }

  // ── Oferta 2: Grupo B (Shopee ou Amazon) ──────────────────
  const groupBOffer = await prisma.offer.findFirst({
    where: {
      store: { in: STORE_GROUPS[1] },
      price: { gt: 0 },
      discountPct: { gte: 15 },
    },
    orderBy: { discountPct: 'desc' },
  })

  if (groupBOffer) {
    selected.push(mapOffer(groupBOffer))
    usedStores.add(groupBOffer.store)
  }

  // ── Oferta 3: Melhor desconto entre lojas NÃO usadas ──────
  const allStores = ['mercadolivre', 'magalu', 'shopee', 'amazon']
  const remaining = allStores.filter((s) => !usedStores.has(s))

  if (remaining.length > 0) {
    const thirdOffer = await prisma.offer.findFirst({
      where: {
        store: { in: remaining },
        price: { gt: 0 },
        discountPct: { gte: 15 },
      },
      orderBy: { discountPct: 'desc' },
    })

    if (thirdOffer) {
      selected.push(mapOffer(thirdOffer))
      usedStores.add(thirdOffer.store)
    }
  }

  // Fallback: se não conseguiu 3, preenche com qualquer loja restante
  if (selected.length < 3) {
    const stillMissing = allStores.filter((s) => !usedStores.has(s))
    for (const store of stillMissing) {
      if (selected.length >= 3) break
      const extra = await prisma.offer.findFirst({
        where: { store, price: { gt: 0 } },
        orderBy: { discountPct: 'desc' },
      })
      if (extra) {
        selected.push(mapOffer(extra))
        usedStores.add(store)
      }
    }
  }

  return selected
}

// ---------------------------------------------------------------------------
// Formatação da mensagem
// ---------------------------------------------------------------------------

/**
 * Monta o texto da mensagem no formato otimizado para WhatsApp/Telegram.
 * Usa negrito com * e emojis para destacar preços.
 */
export function formatOfferMessage(offers: DailyOffer[]): string {
  const date = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  let msg = `🔥 *Ofertas do Dia — ${date}*\n\n`
  msg += `Selecionamos as melhores promoções de hoje pra você! 🏷️\n\n`

  for (let i = 0; i < offers.length; i++) {
    const o = offers[i]
    const emoji = STORE_EMOJI[o.store] ?? '🏪'
    const label = STORE_LABELS[o.store] ?? o.store

    msg += `━━━━━━━━━━━━━━━\n`
    msg += `${emoji} *${label}*\n\n`
    msg += `📦 *${o.title.slice(0, 120)}*\n`
    msg += `💵 De ${formatPrice(o.originalPrice)} por *${formatPrice(o.price)}*\n`
    msg += `🏷️  *-${o.discountPct}% OFF*\n`

    if (o.freeShipping) msg += `📦 Frete grátis\n`
    if (o.installment) msg += `💳 ${o.installment}\n`

    msg += `\n👉 ${o.url}\n\n`
  }

  msg += `━━━━━━━━━━━━━━━\n`
  msg += `🛒 *Aproveite antes que acabe!*\n`
  msg += `Mais ofertas: https://ofertafy.com.br\n`

  return msg
}

// ---------------------------------------------------------------------------
// Disparo via webhook
// ---------------------------------------------------------------------------

/**
 * Envia a mensagem para o webhook configurado.
 *
 * Formatos suportados:
 *   - WhatsApp Evolution API: { number, text }
 *   - Telegram Bot: { chat_id, text, parse_mode: 'Markdown' }
 *   - Discord: { content }
 *   - Genérico: { text }
 */
export async function sendToWebhook(
  text: string,
  webhookUrl: string,
): Promise<string> {
  // Detecta o tipo de webhook pelo formato da URL
  const isTelegram = webhookUrl.includes('telegram.org/bot')
  const isDiscord = webhookUrl.includes('discord.com/api/webhooks')

  let body: Record<string, unknown>

  if (isTelegram) {
    // Telegram Bot API: extrai chat_id do final da URL ou usa o padrão
    body = {
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }
  } else if (isDiscord) {
    body = { content: text }
  } else {
    // WhatsApp / Genérico — Evolution API, Z-API, WPPConnect, etc.
    body = { text }
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  const responseText = await res.text().catch(() => '')

  if (!res.ok) {
    throw new Error(`Webhook HTTP ${res.status}: ${responseText.slice(0, 200)}`)
  }

  return responseText
}

// ---------------------------------------------------------------------------
// Orquestrador principal
// ---------------------------------------------------------------------------

/**
 * Executa o fluxo completo:
 *   1. Seleciona 3 ofertas do banco
 *   2. Formata a mensagem
 *   3. Envia via webhook
 */
export async function dispatchDailyOffers(): Promise<DispatchResult> {
  const webhookUrl = process.env.GROUP_WEBHOOK_URL || ''

  // 1. Selecionar ofertas
  const offers = await prepareDailyOffers()

  if (offers.length === 0) {
    console.log('📢 Nenhuma oferta qualificada encontrada para disparo')
    return { success: false, message: 'Nenhuma oferta disponível', offers: [] }
  }

  console.log(`📢 ${offers.length} ofertas selecionadas:`)
  for (const o of offers) {
    console.log(`   ${STORE_EMOJI[o.store]} ${o.storeLabel}: ${o.title.slice(0, 60)} (-${o.discountPct}%)`)
  }

  // 2. Formatar mensagem
  const message = formatOfferMessage(offers)
  console.log(`📢 Mensagem formatada (${message.length} caracteres)`)

  // 3. Enviar via webhook (se configurado)
  if (!webhookUrl) {
    console.log('📢 GROUP_WEBHOOK_URL não configurado — simulação apenas')
    console.log('─── MENSAGEM ───')
    console.log(message)
    console.log('─── FIM ───')
    return {
      success: true,
      message: 'Mensagem formatada (simulação — webhook não configurado)',
      offers,
    }
  }

  try {
    const responseText = await sendToWebhook(message, webhookUrl)
    console.log(`📢 Webhook enviado com sucesso: ${responseText.slice(0, 100)}`)
    return { success: true, message: 'Enviado com sucesso', offers, webhookResponse: responseText }
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    console.error(`📢 Erro no webhook: ${errMsg}`)
    return { success: false, message: `Erro no envio: ${errMsg}`, offers }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapOffer(o: {
  title: string
  price: number
  originalPrice: number
  discountPct: number
  store: string
  storeLabel: string
  url: string
  freeShipping: boolean
  installment: string | null
}): DailyOffer {
  return {
    title: o.title,
    price: o.price,
    originalPrice: o.originalPrice,
    discountPct: o.discountPct,
    store: o.store,
    storeLabel: o.storeLabel,
    url: getBridgeUrl(o.url, o.storeLabel, true),
    freeShipping: o.freeShipping,
    installment: o.installment,
  }
}

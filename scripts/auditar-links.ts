/**
 * 🔍 AUDITORIA DE LINKS DE AFILIADO
 *
 * Varre 100% dos produtos no banco e testa se os links de afiliado
 * estão seguros e com os parâmetros de rastreio corretos.
 *
 * Uso: npm run audit
 */

import { PrismaClient } from '@prisma/client'
import { getBridgeUrl } from '../src/lib/utils'

// ═══════════════════════════════════════════════════════════
// ANSI Colors (sem dependência externa)
// ═══════════════════════════════════════════════════════════

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

// ═══════════════════════════════════════════════════════════
// Configuração esperada por loja
// ═══════════════════════════════════════════════════════════

const ML_MATT_TOOL = process.env.ML_MATT_TOOL || '35888960'
const MAGALU_STORE_ID = process.env.MAGALU_STORE_ID || 'ofertafy'
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID || '18355150568'
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20'
const TIKTOK_AFFILIATE_ID = process.env.TIKTOK_AFFILIATE_ID || 'eif04je11e51h7'

// ═══════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════

interface OfferRow {
  id: string
  title: string
  url: string
  store: string
}

interface LinkError {
  offerId: string
  title: string
  store: string
  url: string
  bridgeUrl: string
  reason: string
}

interface StoreReport {
  store: string
  checked: number
  ok: number
  errors: LinkError[]
}

// ═══════════════════════════════════════════════════════════
// Regras de validação por loja
// ═══════════════════════════════════════════════════════════

function validateUrl(offer: OfferRow): string | null {
  const url = offer.url?.trim() ?? ''
  const store = offer.store

  // ── UNIVERSAL: não pode ser vazio ──────────────────
  if (!url) return 'URL vazia ou ausente'

  // ── UNIVERSAL: sem espaços em branco ───────────────
  if (/\s/.test(url)) return 'URL contém espaços ou quebra de linha'

  // ── UNIVERSAL: protocolo obrigatório ───────────────
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'URL sem protocolo http:// ou https://'
  }

  // ── Por loja ───────────────────────────────────────
  switch (store) {
    case 'mercadolivre': {
      if (!url.includes(`matt_tool=${ML_MATT_TOOL}`)) {
        return `Falta matt_tool=${ML_MATT_TOOL}`
      }
      // Domínio duplicado: o scraper do ML às vezes retorna
      // "...mercadolivre.com.br/produto.mercadolivre.com.br/MLB-..."
      // em vez de "...mercadolivre.com.br/MLB-..."
      if (url.includes('mercadolivre.com.br/produto.mercadolivre.com.br')) {
        return 'Domínio duplicado na URL (mercadolivre.com.br/produto.mercadolivre.com.br)'
      }
      if (url.includes('mercadolivre.com.br/www.mercadolivre.com.br')) {
        return 'Domínio duplicado na URL (mercadolivre.com.br/www.mercadolivre.com.br)'
      }
      break
    }

    case 'magalu': {
      if (!url.includes(`magazine${MAGALU_STORE_ID}`)) {
        return `Falta magazine${MAGALU_STORE_ID} no link da Magalu`
      }
      if (url.includes('onelink.me')) {
        return 'Contém onelink.me (proibido — rastreio quebrado)'
      }
      break
    }

    case 'amazon': {
      if (!url.includes(`tag=${AMAZON_TAG}`)) {
        return `Falta tag=${AMAZON_TAG}`
      }
      break
    }

    case 'shopee': {
      // Shopee usa short links (s.shopee.com.br) SEM affiliate_id visível.
      // O rastreio é feito via API/referral, não via query param.
      // Verifica se é um link curto da Shopee ou link com affiliate_id.
      const isShortLink = url.includes('s.shopee.com.br') || url.includes('shopee.com.br')
      const hasAffiliate = url.includes(`affiliate_id=${SHOPEE_APP_ID}`)
      if (!isShortLink && !hasAffiliate) {
        return `URL da Shopee inválida (não é short link nem tem affiliate_id=${SHOPEE_APP_ID})`
      }
      break
    }

    case 'tiktok': {
      if (!url.includes('u_code=')) {
        return 'Falta u_code= (afiliado TikTok)'
      }
      break
    }

    default:
      // Loja desconhecida — só valida regras universais
      break
  }

  return null // ✅ OK
}

// ═══════════════════════════════════════════════════════════
// Validação da Bridge URL ( /ir )
// ═══════════════════════════════════════════════════════════

function validateBridge(bridgeUrl: string): string | null {
  if (!bridgeUrl) return 'Bridge URL vazia'
  if (/\s/.test(bridgeUrl)) return 'Bridge URL contém espaços ou quebra de linha'
  if (!bridgeUrl.startsWith('/ir?')) return 'Bridge URL não começa com /ir?'
  if (!bridgeUrl.includes('url=')) return 'Bridge URL: falta parâmetro url='
  if (!bridgeUrl.includes('loja=')) return 'Bridge URL: falta parâmetro loja='
  return null
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  const prisma = new PrismaClient()

  console.log('')
  console.log(C.bold + '🔍 AUDITORIA DE LINKS DE AFILIADO' + C.reset)
  console.log(C.dim + '═'.repeat(62) + C.reset)
  console.log('')

  // ── Buscar todas as ofertas ─────────────────────────
  console.log(C.dim + '📡 Buscando ofertas no banco...' + C.reset)

  const offers: OfferRow[] = await prisma.offer.findMany({
    select: { id: true, title: true, url: true, store: true },
    orderBy: { store: 'asc' },
  })

  console.log(`   ${offers.length} ofertas encontradas`)
  console.log('')

  // ── Agrupar por loja ────────────────────────────────
  const storeMap = new Map<string, OfferRow[]>()
  for (const o of offers) {
    const store = o.store || 'desconhecida'
    if (!storeMap.has(store)) storeMap.set(store, [])
    storeMap.get(store)!.push(o)
  }

  // ── Validar ─────────────────────────────────────────
  const reports: StoreReport[] = []
  let totalErrors = 0

  for (const [store, rows] of storeMap.entries()) {
    const errors: LinkError[] = []

    for (const row of rows) {
      const storeLabel =
        store === 'mercadolivre' ? 'Mercado Livre'
        : store === 'magalu' ? 'Magalu'
        : store === 'amazon' ? 'Amazon'
        : store === 'shopee' ? 'Shopee'
        : store === 'tiktok' ? 'TikTok Shop'
        : store

      const bridgeUrl = getBridgeUrl(row.url, storeLabel)

      // Valida URL bruta
      const urlError = validateUrl(row)

      // Valida Bridge URL
      const bridgeError = validateBridge(bridgeUrl)

      if (urlError || bridgeError) {
        errors.push({
          offerId: row.id,
          title: row.title.slice(0, 80),
          store: row.store,
          url: row.url.slice(0, 200),
          bridgeUrl,
          reason: [urlError, bridgeError].filter(Boolean).join(' | '),
        })
      }
    }

    reports.push({
      store,
      checked: rows.length,
      ok: rows.length - errors.length,
      errors,
    })
    totalErrors += errors.length
  }

  // ── Relatório ───────────────────────────────────────
  console.log(C.bold + '📊 RELATÓRIO POR LOJA' + C.reset)
  console.log(C.dim + '═'.repeat(62) + C.reset)
  console.log('')

  for (const r of reports) {
    const storeLabel =
      r.store === 'mercadolivre' ? '🟡 Mercado Livre'
      : r.store === 'magalu' ? '🔵 Magalu'
      : r.store === 'amazon' ? '🟠 Amazon'
      : r.store === 'shopee' ? '🔴 Shopee'
      : r.store === 'tiktok' ? '🎵 TikTok Shop'
      : `⚪ ${r.store}`

    const pct = r.checked > 0 ? ((r.ok / r.checked) * 100).toFixed(1) : '100.0'
    const statusIcon = r.errors.length === 0 ? C.green + '✅' : C.red + '❌'
    const pctColor = r.errors.length === 0 ? C.green : C.red

    console.log(
      `  ${statusIcon} ${storeLabel}${C.reset}`,
      `→ ${r.checked} checados | ${C.green}${r.ok} OK${C.reset} (${pctColor}${pct}%${C.reset}) |`,
      r.errors.length > 0
        ? `${C.red}${r.errors.length} Erros${C.reset}`
        : `${C.green}0 Erros${C.reset}`,
    )
  }

  // ── Detalhes dos erros ──────────────────────────────
  if (totalErrors > 0) {
    console.log('')
    console.log(C.bold + C.red + '❌ ERROS ENCONTRADOS' + C.reset)
    console.log(C.dim + '═'.repeat(62) + C.reset)

    for (const r of reports) {
      if (r.errors.length === 0) continue

      const storeLabel =
        r.store === 'mercadolivre' ? 'Mercado Livre'
        : r.store === 'magalu' ? 'Magalu'
        : r.store === 'amazon' ? 'Amazon'
        : r.store === 'shopee' ? 'Shopee'
        : r.store === 'tiktok' ? 'TikTok Shop'
        : r.store

      console.log('')
      console.log(C.yellow + `  ${storeLabel}: ${r.errors.length} erro(s)` + C.reset)

      const show = r.errors.slice(0, 10)
      for (const e of show) {
        console.log('')
        console.log(C.dim + `    ID:    ${e.offerId}` + C.reset)
        console.log(C.dim + `    Título: ${e.title}` + C.reset)
        console.log(C.red + `    ❌ ${e.reason}` + C.reset)
        console.log(C.dim + `    URL DB:    ${e.url}` + C.reset)
        console.log(C.dim + `    Bridge:    ${e.bridgeUrl}` + C.reset)
      }

      if (r.errors.length > 10) {
        console.log('')
        console.log(C.dim + `    ... e mais ${r.errors.length - 10} erros` + C.reset)
      }
    }
  } else {
    console.log('')
    console.log(C.green + C.bold + '✅ TODOS OS LINKS ESTÃO SEGUROS!' + C.reset)
  }

  // ── Resumo final ────────────────────────────────────
  console.log('')
  console.log(C.dim + '═'.repeat(62) + C.reset)
  console.log(
    C.bold +
      `📦 Total: ${offers.length} ofertas | ` +
      C.green + `${offers.length - totalErrors} OK` + C.reset +
      C.bold + ' | ' +
      (totalErrors > 0 ? C.red : C.green) + `${totalErrors} erros` + C.reset,
  )
  console.log('')

  await prisma.$disconnect()
  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(C.red + 'Erro fatal:' + C.reset, e)
  process.exit(1)
})

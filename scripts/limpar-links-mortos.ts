/**
 * 🧹 LIMPADOR DE LINKS MORTOS
 *
 * Varre o banco e remove ofertas cujo link de destino retorna HTTP 404.
 * Usa requisições HEAD (leves) com rate limiting para evitar bloqueios.
 *
 * Uso:
 *   npm run clean-dead-links              (dry-run — só lista, não apaga)
 *   npm run clean-dead-links -- --exec    (executa de verdade)
 *   npm run clean-dead-links -- --exec --store=mercadolivre  (filtra por loja)
 *
 * Flags:
 *   --exec              Confirma a remoção (sem isso é simulação)
 *   --store=<slug>      Filtra por loja (mercadolivre, magalu, amazon, shopee)
 *   --delay=<ms>        Intervalo entre requisições (default: 600ms ≈ 1.6 req/s)
 *   --timeout=<ms>      Timeout por requisição (default: 8000ms)
 */

import { PrismaClient } from '@prisma/client'

// ═══════════════════════════════════════════════════════════
// Configuração
// ═══════════════════════════════════════════════════════════

const DRY_RUN = !process.argv.includes('--exec')
const STORE_FILTER = process.argv
  .find((a) => a.startsWith('--store='))
  ?.split('=')[1]
const DELAY_MS = parseInt(
  process.argv.find((a) => a.startsWith('--delay='))?.split('=')[1] || '600',
)
const TIMEOUT_MS = parseInt(
  process.argv.find((a) => a.startsWith('--timeout='))?.split('=')[1] || '8000',
)

// ═══════════════════════════════════════════════════════════
// ANSI Colors
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
// Helpers
// ═══════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const STORE_ICONS: Record<string, string> = {
  mercadolivre: '🟡',
  magalu: '🔵',
  amazon: '🟠',
  shopee: '🔴',
  tiktok: '🎵',
}

/**
 * Faz uma requisição HEAD e retorna o status code.
 * Retorna -1 em caso de erro de rede/timeout (não remove nesses casos).
 */
async function checkLink(url: string): Promise<number> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    })
    clearTimeout(timer)
    return res.status
  } catch {
    clearTimeout(timer)
    return -1 // Erro de rede / timeout → conservador: não remove
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  const prisma = new PrismaClient()

  console.log('')
  console.log(C.bold + '🧹 LIMPADOR DE LINKS MORTOS' + C.reset)
  console.log(C.dim + '═'.repeat(58) + C.reset)
  console.log(
    `   Modo:       ${DRY_RUN ? C.yellow + 'SIMULAÇÃO (dry-run)' : C.red + 'EXECUÇÃO REAL' + C.reset}`,
  )
  console.log(`   Loja:       ${STORE_FILTER || 'TODAS'}`)
  console.log(`   Rate limit: ${DELAY_MS}ms entre reqs (~${(1000 / DELAY_MS).toFixed(1)} req/s)`)
  console.log(`   Timeout:    ${TIMEOUT_MS}ms`)
  console.log('')

  // ── Buscar ofertas ──────────────────────────────────
  const where = STORE_FILTER ? { store: STORE_FILTER } : {}

  const total = await prisma.offer.count({ where })
  console.log(C.dim + `📡 ${total} ofertas para verificar...` + C.reset)
  console.log('')

  const offers = await prisma.offer.findMany({
    where,
    select: { id: true, title: true, url: true, store: true },
    orderBy: { store: 'asc' },
  })

  // ── Verificar uma a uma ─────────────────────────────
  const dead: Array<{ id: string; title: string; url: string; store: string }> = []
  let checked = 0
  let alive = 0
  let networkErrors = 0

  const startTime = Date.now()

  for (const o of offers) {
    const icon = STORE_ICONS[o.store] || '⚪'

    process.stdout.write(
      `\r   ${icon} ${String(checked + 1).padStart(5)}/${total} — ${o.title.slice(0, 50).padEnd(50)}`,
    )

    const status = await checkLink(o.url)
    checked++

    if (status === 404 || status === 410) {
      dead.push(o)
      process.stdout.write(C.red + ` [${status}]` + C.reset)
    } else if (status >= 200 && status < 400) {
      alive++
      process.stdout.write(C.green + ` [${status}]` + C.reset)
    } else if (status === -1) {
      networkErrors++
      process.stdout.write(C.yellow + ' [ERR]' + C.reset)
    } else {
      alive++ // 403, 301, etc → considera vivo
      process.stdout.write(C.dim + ` [${status}]` + C.reset)
    }

    process.stdout.write('\n')

    // Rate limiting
    if (checked < total) {
      await sleep(DELAY_MS)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  // ── Relatório ───────────────────────────────────────
  console.log('')
  console.log(C.bold + '📊 RESULTADO' + C.reset)
  console.log(C.dim + '═'.repeat(58) + C.reset)
  console.log(
    `   ${C.green}✓ Vivos:        ${alive}${C.reset}`,
  )
  console.log(
    `   ${C.red}✗ Mortos (404):  ${dead.length}${C.reset}`,
  )
  console.log(
    `   ${C.yellow}⚠ Erros rede:   ${networkErrors}${C.reset} (conservados — sem remoção)`,
  )
  console.log(`   ⏱  Tempo:         ${elapsed}s`)
  console.log('')

  // ── Listar mortos ───────────────────────────────────
  if (dead.length > 0) {
    console.log(C.bold + C.red + '💀 LINKS MORTOS ENCONTRADOS' + C.reset)
    console.log(C.dim + '═'.repeat(58) + C.reset)
    for (const d of dead.slice(0, 30)) {
      console.log(C.dim + `   ${d.id.slice(0, 14)}` + C.reset + `  ${d.title.slice(0, 70)}`)
      console.log(C.red + `        ${d.url.slice(0, 120)}` + C.reset)
    }
    if (dead.length > 30) {
      console.log(C.dim + `   ... e mais ${dead.length - 30} links` + C.reset)
    }
    console.log('')
  }

  // ── Remover (se --exec) ─────────────────────────────
  if (DRY_RUN) {
    if (dead.length > 0) {
      console.log(
        C.yellow +
          `   ⚠️  DRY-RUN: ${dead.length} ofertas seriam removidas.` +
          C.reset,
      )
      console.log(
        C.yellow +
          '   Execute com --exec para confirmar a remoção.' +
          C.reset,
      )
      console.log(
        C.yellow +
          '   Ex: npm run clean-dead-links -- --exec' +
          C.reset,
      )
    } else {
      console.log(C.green + '   ✅ Nenhum link morto encontrado!' + C.reset)
    }
  } else {
    // EXECUÇÃO REAL
    let removidos = 0
    let falhas = 0

    for (const d of dead) {
      try {
        await prisma.offer.delete({ where: { id: d.id } })
        console.log(C.red + `   🗑️  REMOVIDO: ${d.title.slice(0, 60)}` + C.reset)
        removidos++
      } catch (e: any) {
        console.error(C.red + `   ❌ FALHA: ${d.id} — ${e.message?.slice(0, 80)}` + C.reset)
        falhas++
      }
    }

    console.log('')
    console.log(C.bold + '🗑️  REMOÇÃO CONCLUÍDA' + C.reset)
    console.log(
      `   ${C.red}Removidos: ${removidos}${C.reset}  |  ${C.red}Falhas: ${falhas}${C.reset}`,
    )
  }

  console.log('')
  await prisma.$disconnect()
  process.exit(0)
}

main().catch((e) => {
  console.error(C.red + 'Erro fatal:' + C.reset, e)
  process.exit(1)
})

/**
 * 🔧 CORREÇÃO EM LOTE — Links do Mercado Livre com domínio duplicado
 *
 * Padrão inválido:
 *   https://www.mercadolivre.com.br/produto.mercadolivre.com.br/MLB-...?matt_tool=...
 * Padrão correto:
 *   https://www.mercadolivre.com.br/MLB-...?matt_tool=...
 *
 * Uso: npx tsx scripts/corrigir-links-ml.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Diagnóstico ──────────────────────────────────────────
async function diagnosticar() {
  // Busca TODOS os ML e filtra em memória (evita problemas de
  // case-sensitivity / encoding no contains do Prisma/PostgreSQL)
  const todos = await prisma.offer.findMany({
    where: { store: 'mercadolivre' },
    select: { id: true, url: true, title: true },
  })

  const dups = todos.filter(
    (o: any) =>
      o.url.includes('mercadolivre.com.br/produto.mercadolivre.com.br') ||
      o.url.includes('mercadolivre.com.br/www.mercadolivre.com.br'),
  )

  console.log(`📊 ML total: ${todos.length} | Com domínio duplicado: ${dups.length}`)
  return dups
}

// ── Correção ─────────────────────────────────────────────
function corrigirUrl(url: string): string {
  // Padrão 1: ...mercadolivre.com.br/produto.mercadolivre.com.br/... → ...mercadolivre.com.br/...
  let fixed = url.replace(
    /mercadolivre\.com\.br\/produto\.mercadolivre\.com\.br\//g,
    'mercadolivre.com.br/',
  )
  // Padrão 2: ...mercadolivre.com.br/www.mercadolivre.com.br/... → ...mercadolivre.com.br/...
  fixed = fixed.replace(
    /mercadolivre\.com\.br\/www\.mercadolivre\.com\.br\//g,
    'mercadolivre.com.br/',
  )
  return fixed
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log('🔧 CORREÇÃO DE LINKS ML COM DOMÍNIO DUPLICADO\n')

  const dups = await diagnosticar()

  if (dups.length === 0) {
    console.log('✅ Nenhum link para corrigir!')
    await prisma.$disconnect()
    return
  }

  console.log(`\n🔨 Corrigindo ${dups.length} ofertas...\n`)

  let ok = 0
  let falhas = 0

  for (const o of dups) {
    const antes = o.url
    const depois = corrigirUrl(antes)

    if (antes === depois) {
      console.log(`⚠️  ${o.id.slice(0, 12)} — sem alteração`)
      continue
    }

    try {
      await prisma.offer.update({
        where: { id: o.id },
        data: { url: depois },
      })
      console.log(`✅ ${o.title.slice(0, 60)}`)
      console.log(`   ANTES:  ${antes.slice(0, 110)}`)
      console.log(`   DEPOIS: ${depois.slice(0, 110)}`)
      ok++
    } catch (e: any) {
      console.error(`❌ ${o.id}: ${e.message?.slice(0, 100)}`)
      falhas++
    }
  }

  // ── Re-verificação ──────────────────────────────────
  console.log('\n🔍 Re-verificando...')
  const restam = await diagnosticar()

  console.log(`\n═══════════════════════════════════════`)
  console.log(`✅ Corrigidos: ${ok}  |  ❌ Falhas: ${falhas}  |  📦 Restam: ${restam.length}`)
  console.log('')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Erro fatal:', e)
  process.exit(1)
})

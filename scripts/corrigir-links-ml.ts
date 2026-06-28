/**
 * 🔧 CORREÇÃO EM LOTE — Links do Mercado Livre com domínio duplicado
 *
 * Corrige URLs do tipo:
 *   https://www.mercadolivre.com.br/produto.mercadolivre.com.br/MLB-...
 * Para:
 *   https://www.mercadolivre.com.br/MLB-...
 *
 * Uso: npx tsx scripts/corrigir-links-ml.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function fixDuplicatedDomain(url: string): { fixed: string; changed: boolean } {
  // Padrão 1: mercadolivre.com.br/produto.mercadolivre.com.br/
  if (url.includes('mercadolivre.com.br/produto.mercadolivre.com.br')) {
    const fixed = url.replace(
      /mercadolivre\.com\.br\/produto\.mercadolivre\.com\.br\//,
      'mercadolivre.com.br/',
    )
    return { fixed, changed: true }
  }

  // Padrão 2: mercadolivre.com.br/www.mercadolivre.com.br/
  if (url.includes('mercadolivre.com.br/www.mercadolivre.com.br')) {
    const fixed = url.replace(
      /mercadolivre\.com\.br\/www\.mercadolivre\.com\.br\//,
      'mercadolivre.com.br/',
    )
    return { fixed, changed: true }
  }

  return { fixed: url, changed: false }
}

async function main() {
  console.log('🔧 Buscando ofertas do Mercado Livre com domínio duplicado...\n')

  const offers = await prisma.offer.findMany({
    where: {
      store: 'mercadolivre',
      url: { contains: 'mercadolivre.com.br/produto.mercadolivre.com.br' },
    },
    select: { id: true, title: true, url: true },
  })

  // Também busca o outro padrão
  const offers2 = await prisma.offer.findMany({
    where: {
      store: 'mercadolivre',
      url: { contains: 'mercadolivre.com.br/www.mercadolivre.com.br' },
    },
    select: { id: true, title: true, url: true },
  })

  // Junta sem duplicar por ID
  const seen = new Set<string>()
  const all = [...offers, ...offers2].filter((o) => {
    if (seen.has(o.id)) return false
    seen.add(o.id)
    return true
  })

  if (all.length === 0) {
    console.log('✅ Nenhum link com domínio duplicado encontrado!')
    await prisma.$disconnect()
    return
  }

  console.log(`📦 ${all.length} ofertas para corrigir\n`)

  let corrigidos = 0
  let falhas = 0

  for (const o of all) {
    const { fixed, changed } = fixDuplicatedDomain(o.url)

    if (!changed) {
      console.log(`⚠️  ${o.id.slice(0, 12)} — já estava correto?`)
      continue
    }

    try {
      await prisma.offer.update({
        where: { id: o.id },
        data: { url: fixed },
      })
      console.log(`✅ ${o.title.slice(0, 60)}`)
      console.log(`   ANTES:  ${o.url.slice(0, 120)}`)
      console.log(`   DEPOIS: ${fixed.slice(0, 120)}`)
      console.log('')
      corrigidos++
    } catch (e: any) {
      console.error(`❌ ${o.id}: ${e.message?.slice(0, 100)}`)
      falhas++
    }
  }

  console.log('═'.repeat(60))
  console.log(`✅ ${corrigidos} corrigidos | ❌ ${falhas} falhas`)
  console.log('')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Erro fatal:', e)
  process.exit(1)
})

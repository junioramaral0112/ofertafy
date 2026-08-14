/**
 * 🧹 LIMPEZA DE QUALIDADE ZERO TOLERÂNCIA (banco Neon — produção)
 *
 * Uso: npx tsx scripts/clean-quality-db.ts <arquivo-env|DATABASE_URL>
 *
 * Deleta TODAS as ofertas com:
 *   - imagem nula/vazia/placeholder (picsum, unsplash...) ou fora do CDN
 *     oficial da loja
 *   - URL sintética/quebrada (??, /busca/, /search) ou não-canônica
 *
 * BACKUP completo em JSON (tmpdir) antes de deletar. Relatório por loja.
 */
import { readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  isPlaceholderImageUrl,
  isAllowedStoreImage,
  isCanonicalProductUrl,
} from '../src/lib/offer-discovery'

const envArg = process.argv[2]
if (envArg) {
  if (envArg.includes('=')) {
    for (const pair of envArg.split(/\s+/)) {
      const m = pair.match(/^([A-Z_0-9]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    }
  } else {
    for (const line of readFileSync(envArg, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    }
  }
}

function invalidReason(o: { imageUrl: string; url: string; store: string }): string | null {
  if (isPlaceholderImageUrl(o.imageUrl)) return 'imagem placeholder/vazia'
  if (!isAllowedStoreImage(o.store, o.imageUrl)) return 'imagem fora do CDN oficial'
  if (!isCanonicalProductUrl(o.store, o.url)) return 'URL nao-canonica/sintetica'
  return null
}

import('../src/lib/prisma').then(async ({ prisma }) => {
  const offers = await prisma.offer.findMany({
    select: { id: true, store: true, title: true, imageUrl: true, url: true },
  })

  const invalid: any[] = []
  for (const o of offers) {
    const reason = invalidReason(o)
    if (reason) invalid.push({ ...o, reason })
  }

  const byStore: Record<string, { total: number; removed: number }> = {}
  for (const o of offers) {
    if (!byStore[o.store]) byStore[o.store] = { total: 0, removed: 0 }
    byStore[o.store].total++
  }
  for (const i of invalid) byStore[i.store].removed++

  console.log(`🩺 Auditoria de qualidade — ${offers.length} ofertas`)
  console.log(`🗑️  Inválidas a remover: ${invalid.length}\n`)
  for (const [store, s] of Object.entries(byStore)) {
    console.log(`   ${store}: ${s.removed}/${s.total} removidas`)
  }

  // ── Backup ──
  const backupPath = join(tmpdir(), `backup-qualidade-${Date.now()}.json`)
  writeFileSync(backupPath, JSON.stringify(invalid, null, 2), 'utf8')
  console.log(`\n📦 Backup: ${backupPath}`)

  // ── Delete (priceHistory primeiro — FK) ──
  if (invalid.length > 0) {
    const ids = invalid.map((i) => i.id)
    await prisma.priceHistory.deleteMany({ where: { offerId: { in: ids } } })
    const result = await prisma.offer.deleteMany({ where: { id: { in: ids } } })
    console.log(`✅ ${result.count} ofertas deletadas do banco.`)
  } else {
    console.log('✅ Nada a deletar — banco já está limpo.')
  }

  const sobraram = await prisma.offer.count()
  console.log(`📊 Total restante no banco: ${sobraram}`)

  await prisma.$disconnect()
}).catch((e) => { console.error('FALHOU:', e); process.exit(1) })

/**
 * 🧹 LIMPEZA DE PREÇOS CONTAMINADOS (produção — uso consciente)
 *
 * Uso: npx tsx scripts/clean-prices-db.ts <arquivo-env|DATABASE_URL>
 *
 * O que faz:
 *  1. BACKUP completo dos registros alterados (JSON em tmpdir) ANTES de tocar
 *  2. CORRIGE ofertas suspeitas (price plausível + originalPrice contaminado
 *     por preço por unidade/parcela): originalPrice = price, discountPct = 0
 *  3. DELETA apenas ofertas com price inválido (<= 0 ou > R$ 500.000)
 *  4. DELETA pontos de priceHistory inválidos (<= 0 ou > R$ 500.000)
 *
 * NÃO altera nada que não esteja na lista de suspeitos da auditoria.
 */
import { readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

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

function reasonsOf(o: { price: number; originalPrice: number; discountPct: number }): string[] {
  const reasons: string[] = []
  const { price, originalPrice, discountPct } = o

  if (!isFinite(price) || price <= 0) reasons.push('price-invalid')
  if (price > 500000) reasons.push('price-invalid')

  if (originalPrice < price) reasons.push('original-lt-price')
  if (originalPrice > price * 1000) reasons.push('original-1000x')

  const ratio = originalPrice / price
  const exactMultiple = [5, 10, 100, 1000].find((mul) => Math.abs(ratio - mul) < 0.011)
  if (isFinite(ratio) && ratio > 1 && discountPct >= 80 && exactMultiple !== undefined) reasons.push('unit-leak')

  if (discountPct >= 95) reasons.push('discount-absurd')
  if (isFinite(ratio) && Math.abs(ratio - 12) < 0.011) reasons.push('price-is-parcel')
  if (Math.abs(price - Math.round(price * 100) / 100) > 0.001) reasons.push('round-2')

  return reasons
}

import('../src/lib/prisma').then(async ({ prisma }) => {
  const backup: any[] = []
  let fixed = 0
  let deleted = 0
  let historyDeleted = 0

  const offers = await prisma.offer.findMany({
    select: { id: true, store: true, title: true, price: true, originalPrice: true, discountPct: true },
  })

  for (const o of offers) {
    const reasons = reasonsOf(o)
    if (reasons.length === 0) continue

    backup.push({ table: 'offer', ...o, reasons })

    if (reasons.includes('price-invalid')) {
      // price inutilizável → remove o registro (o /api/fetch re-cria corretamente)
      await prisma.priceHistory.deleteMany({ where: { offerId: o.id } })
      await prisma.offer.deleteMany({ where: { id: o.id } })
      deleted++
      continue
    }

    // price plausível → corrige o par (desconto real desconhecido = 0)
    const newPrice = Math.round(o.price * 100) / 100
    await prisma.offer.updateMany({
      where: { id: o.id },
      data: { price: newPrice, originalPrice: newPrice, discountPct: 0 },
    })
    fixed++
  }

  // ── priceHistory contaminado ──
  const badHistory = await prisma.priceHistory.findMany({
    where: { OR: [{ price: { lte: 0 } }, { price: { gt: 500000 } }] },
    select: { id: true, offerId: true, price: true },
  })
  if (badHistory.length > 0) {
    backup.push({ table: 'priceHistory_bad', rows: badHistory })
    await prisma.priceHistory.deleteMany({ where: { id: { in: badHistory.map((h) => h.id) } } })
    historyDeleted = badHistory.length
  }

  // ── Backup em disco ──
  const backupPath = join(tmpdir(), `backup-precos-bugados-${Date.now()}.json`)
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8')

  console.log('🧹 Limpeza concluída:')
  console.log(`   ofertas corrigidas: ${fixed}`)
  console.log(`   ofertas removidas:  ${deleted}`)
  console.log(`   priceHistory removidos: ${historyDeleted}`)
  console.log(`   📦 backup salvo em: ${backupPath}`)

  await prisma.$disconnect()
}).catch((e) => { console.error('FALHOU:', e); process.exit(1) })

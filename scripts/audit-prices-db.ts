/**
 * 🩺 AUDITORIA DE PREÇOS DO BANCO (somente leitura — NÃO apaga nada)
 *
 * Uso: npx tsx scripts/audit-prices-db.ts <arquivo-env>
 *   onde <arquivo-env> é o .env com DATABASE_URL (produção).
 *
 * Classifica ofertas suspeitas:
 *   A. price <= 0 ou > R$ 500.000
 *   B. originalPrice < price (inconsistente)
 *   C. originalPrice > 1000x price (preço por unidade vazado)
 *   D. originalPrice/price = múltiplo inteiro exato {5,10,100,1000} e desconto >= 80
 *      (preço por kg/litro vazado — o bug Baw Waw produz múltiplos exatos)
 *   E. desconto >= 95% (absurdo)
 *   F. originalPrice/price == 12 (price pode ser parcela de 12x)
 *   G. price fora de 2 casas decimais
 */
import { readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const envFile = process.argv[2]
if (envFile) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2]
  }
}

import('../src/lib/prisma').then(({ prisma }) => main(prisma)).catch((e) => {
  console.error('FALHOU:', e)
  process.exit(1)
})

interface Suspect {
  id: string
  store: string
  title: string
  price: number
  originalPrice: number
  discountPct: number
  reasons: string[]
}

function auditOffer(o: { price: number; originalPrice: number; discountPct: number }): string[] {
  const reasons: string[] = []
  const { price, originalPrice, discountPct } = o

  if (!isFinite(price) || price <= 0) reasons.push('A: price inválido (<= 0)')
  if (price > 500000) reasons.push('A: price > R$ 500.000')

  if (originalPrice < price) reasons.push('B: originalPrice < price')

  if (originalPrice > price * 1000) reasons.push('C: originalPrice > 1000x price (unidade vazada)')

  const ratio = originalPrice / price
  const exactMultiple = [5, 10, 100, 1000].find((mul) => Math.abs(ratio - mul) < 0.011)
  if (isFinite(ratio) && ratio > 1 && discountPct >= 80 && exactMultiple !== undefined) {
    reasons.push(`D: original/price = ${exactMultiple}x exato (unidade vazada)`)
  }
  if (discountPct >= 95) reasons.push('E: desconto >= 95% (absurdo)')

  if (isFinite(ratio) && Math.abs(ratio - 12) < 0.011) reasons.push('F: original/price == 12 (price pode ser parcela)')

  if (Math.abs(price - Math.round(price * 100) / 100) > 0.001) reasons.push('G: price fora de 2 casas decimais')

  return reasons
}

async function main(prisma: any) {
  console.log('🩺 Auditoria de preços do banco (somente leitura)...\n')

  const offers = await prisma.offer.findMany({
    select: { id: true, store: true, title: true, price: true, originalPrice: true, discountPct: true },
  })

  const byStore: Record<string, { total: number; suspect: number }> = {}
  const suspects: Suspect[] = []

  for (const o of offers) {
    const reasons = auditOffer(o)
    if (!byStore[o.store]) byStore[o.store] = { total: 0, suspect: 0 }
    byStore[o.store].total++
    if (reasons.length > 0) {
      byStore[o.store].suspect++
      suspects.push({ id: o.id, store: o.store, title: o.title, price: o.price, originalPrice: o.originalPrice, discountPct: o.discountPct, reasons })
    }
  }

  console.log('Total de ofertas no banco: ' + offers.length)
  console.log('Suspeitos encontrados: ' + suspects.length + '\n')

  for (const [store, s] of Object.entries(byStore).sort()) {
    console.log(`${store}: ${s.suspect}/${s.total} suspeitos`)
  }

  // Detalhe: top 25 suspeitos
  console.log('\n── Exemplos (top 25) ──')
  for (const s of suspects.slice(0, 25)) {
    console.log(`[${s.store}] ${s.title.slice(0, 55)} | price=${s.price} original=${s.originalPrice} desc=${s.discountPct}% | ${s.reasons.join(', ')}`)
  }

  // Salva lista completa em arquivo temporário
  const outPath = join(tmpdir(), 'audit-suspeitos.json')
  writeFileSync(outPath, JSON.stringify(suspects, null, 2), 'utf8')
  console.log(`\n📄 Lista completa (${suspects.length}) salva em ${outPath}`)

  await prisma.$disconnect()
}

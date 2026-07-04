/**
 * 📥 IMPORTADOR SHEIN POR LISTA DE LINKS
 *
 * Lê shein_links.txt (1 URL por linha) e importa produtos
 * para o banco de dados via Prisma.
 *
 * Uso: npx tsx scripts/import-shein-links.ts
 *
 * Rate limit: 800ms entre requisições (1.25 req/s)
 * Timeout: 15s por requisição
 * Resiliência: retry 2x com backoff em falhas
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

const LINKS_FILE = resolve(process.cwd(), 'shein_links.txt')
const MIN_DELAY_MS = 800
const MAX_DELAY_MS = 1500
const TIMEOUT_MS = 15000
const MAX_RETRIES = 2
const BATCH_SIZE = 10          // Links processados por lote
const BATCH_REST_MS = 5000      // Pausa extra entre lotes (anti-bloqueio)

const prisma = new PrismaClient()

interface SheinProduct {
  sourceId: string
  title: string
  description: string | null
  imageUrl: string
  price: number
  originalPrice: number
  discountPct: number
  url: string
  store: string
  storeLabel: string
  category: string
  categorySlug: string
  installment: string | null
  freeShipping: boolean
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Extrai o ID do produto de qualquer formato de URL SHEIN */
function extractProductId(url: string): string | null {
  // br.shein.com/product-p-486969975-cat-15247.html → 486969975
  const m = url.match(/-p-(\d+)/)
  return m ? m[1] : null
}

/** Busca dados do produto via página SHEIN (fetch leve) */
async function fetchProductData(productId: string): Promise<{
  title: string; price: number; originalPrice: number; imageUrl: string
} | null> {
  const url = `https://www.shein.com.br/pdsearch/${productId}/?page=1`

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'pt-BR',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      if (!res.ok) {
        if (attempt <= MAX_RETRIES) { await sleep(1000 * attempt); continue }
        return null
      }

      const html = await res.text()

      // Tentar extrair do HTML
      const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
      const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])
      const amounts = Array.from(html.matchAll(/"salePrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))
      const retailAmounts = Array.from(html.matchAll(/"retailPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

      // Fallback: goods_id (para confirmar)
      const ids = Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1])

      // Encontrar o índice do nosso productId nos ids
      const idx = ids.indexOf(productId)
      const i = idx >= 0 ? idx : 0

      if (names[i] && amounts[i] > 0) {
        return {
          title: names[i],
          price: amounts[i],
          originalPrice: retailAmounts[i] || Math.round(amounts[i] * 1.4 * 100) / 100,
          imageUrl: imgs[i]?.startsWith('//') ? `https:${imgs[i]}` : (imgs[i] || ''),
        }
      }

      // Fallback: primeiro nome e preço disponíveis
      if (names[0] && amounts[0] > 0) {
        return {
          title: names[0],
          price: amounts[0],
          originalPrice: retailAmounts[0] || Math.round(amounts[0] * 1.4 * 100) / 100,
          imageUrl: imgs[0]?.startsWith('//') ? `https:${imgs[0]}` : (imgs[0] || ''),
        }
      }

      return null
    } catch (e: any) {
      if (attempt <= MAX_RETRIES) {
        console.log(`      ⚠️ Tentativa ${attempt}/${MAX_RETRIES + 1}: ${e.message?.slice(0, 40)}`)
        await sleep(2000 * attempt)
        continue
      }
      return null
    }
  }
  return null
}

function buildOffer(productId: string, data: { title: string; price: number; originalPrice: number; imageUrl: string }): SheinProduct {
  const finalOrig = data.originalPrice > data.price ? data.originalPrice : Math.round(data.price * 1.4 * 100) / 100
  const discountPct = finalOrig > data.price ? Math.round(((finalOrig - data.price) / finalOrig) * 100) : 0

  return {
    sourceId: `shein-${productId}`,
    title: data.title.slice(0, 250),
    description: null,
    imageUrl: data.imageUrl || `https://picsum.photos/seed/shein-${productId}/400/400`,
    price: data.price,
    originalPrice: finalOrig,
    discountPct,
    url: `https://br.shein.com/product-p-${productId}.html`,
    store: 'shein',
    storeLabel: 'SHEIN',
    category: 'Moda Feminina',
    categorySlug: 'moda-feminina',
    installment: data.price > 40 ? `3x R$ ${(data.price / 3).toFixed(2)}` : null,
    freeShipping: data.price > 50,
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('📥 IMPORTADOR SHEIN POR LINKS\n')

  // 1. Ler arquivo
  let raw: string
  try {
    raw = readFileSync(LINKS_FILE, 'utf-8')
  } catch {
    console.error(`❌ Arquivo não encontrado: ${LINKS_FILE}`)
    console.error('   Crie o arquivo shein_links.txt com 1 URL por linha.')
    process.exit(1)
  }

  const links = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.startsWith('http'))

  console.log(`📄 ${links.length} links encontrados em shein_links.txt\n`)

  // 2. Extrair IDs únicos
  const idMap = new Map<string, string>()
  for (const link of links) {
    const id = extractProductId(link)
    if (id && !idMap.has(id)) idMap.set(id, link)
  }

  const productIds = Array.from(idMap.keys())
  console.log(`🆔 ${productIds.length} IDs únicos extraídos\n`)

  // 3. Processar em lotes com delay randômico (anti-bloqueio)
  const totalBatches = Math.ceil(productIds.length / BATCH_SIZE)
  let imported = 0
  let skipped = 0
  let errors = 0
  const startTime = Date.now()

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * BATCH_SIZE
    const batchIds = productIds.slice(batchStart, batchStart + BATCH_SIZE)

    console.log(`\n📦 Lote ${batch + 1}/${totalBatches} (${batchIds.length} produtos)`)
    console.log('─'.repeat(50))

    for (let j = 0; j < batchIds.length; j++) {
      const id = batchIds[j]
      const globalIndex = batchStart + j + 1
      const progress = `[${String(globalIndex).padStart(4)}/${productIds.length}]`

      process.stdout.write(`   ${progress} ID:${id.padEnd(12)} `)

      // Verificar se já existe
      const existing = await prisma.offer.findFirst({
        where: { sourceId: `shein-${id}`, store: 'shein' },
      })

      if (existing) {
        console.log('⏭  já existe')
        skipped++
      } else {
        // Buscar dados
        const data = await fetchProductData(id)

        if (!data) {
          console.log('❌ sem dados')
          errors++
        } else {
          const offer = buildOffer(id, data)
          try {
            await prisma.offer.create({ data: offer as any })
            console.log(`✅ ${data.title.slice(0, 40)} | R$${data.price.toFixed(2)}`)
            imported++
          } catch (e: any) {
            console.log(`❌ save: ${e.message?.slice(0, 30)}`)
            errors++
          }
        }
      }

      // Delay randômico entre links (simula usuário real)
      const delay = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS))
      await sleep(delay)
    }

    // Pausa extra entre lotes (respiração anti-bloqueio)
    if (batch < totalBatches - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      console.log(`\n   ⏸  Pausa de ${BATCH_REST_MS / 1000}s... (${elapsed}s decorridos)`)
      await sleep(BATCH_REST_MS)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log(`\n⏱  Tempo total: ${totalTime}s`)
  console.log(`✅ Importado: ${imported} | ⏭  Pulados: ${skipped} | ❌ Erros: ${errors}`)

  // Estatísticas
  const total = await prisma.offer.count({ where: { store: 'shein' } })
  console.log(`📊 Total SHEIN no banco: ${total}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })

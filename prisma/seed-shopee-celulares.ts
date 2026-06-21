/**
 * 🚀 SEED MASSIVO — Shopee: Cordões e Acessórios para Celular
 *
 * Busca ~300+ produtos reais via API GraphQL oficial da Shopee
 * com múltiplas variações de keywords + paginação.
 *
 * Uso: npx tsx prisma/seed-shopee-celulares.ts
 *
 * Estratégia:
 *   - 10 keywords diferentes para cordões/straps
 *   - 2 páginas por keyword (50 itens/página)
 *   - Dedup automático por sourceId
 *   - Preços via sanitizePrice
 *   - Links com affiliate_id oficial
 */

import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

// ═══════════════════════════════════════════════════════════
// Config (do .env)
// ═══════════════════════════════════════════════════════════

const APP_ID = process.env.SHOPEE_APP_ID || ''
const SECRET = process.env.SHOPEE_SECRET || ''
const AFFILIATE_ID = APP_ID || '18355150568'

if (!APP_ID || !SECRET) {
  console.error('❌ SHOPEE_APP_ID e SHOPEE_SECRET precisam estar no .env')
  process.exit(1)
}

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════════
// Keywords otimizadas para cordões de celular
// ═══════════════════════════════════════════════════════════

const KEYWORDS = [
  'cordão para celular',
  'cordão transversal celular',
  'strap celular',
  'corda de celular',
  'colar para celular',
  'porta celular cordão',
  'cordinha para celular',
  'salva celular',
  'acessório para celular',
  'corrente para celular',
]

const ITEMS_PER_PAGE = 50
const MAX_PAGES = 2 // 100 produtos por keyword (máximo)

// ═══════════════════════════════════════════════════════════
// Assinatura Shopee GraphQL
// ═══════════════════════════════════════════════════════════

function sign(ts: number, payload: string): string {
  return crypto
    .createHash('sha256')
    .update(`${APP_ID}${ts}${payload}${SECRET}`)
    .digest('hex')
}

async function graphql(query: string, variables: Record<string, unknown>) {
  const ts = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({ query, variables })
  const sig = sign(ts, body)

  const res = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${ts}, Signature=${sig}`,
    },
    body,
    signal: AbortSignal.timeout(15000),
  })

  return res.json() as any
}

// ═══════════════════════════════════════════════════════════
// Busca produtos por keyword
// ═══════════════════════════════════════════════════════════

const SEARCH_QUERY = `
query($kw: String!, $page: Int, $limit: Int, $sort: Int) {
  productOfferV2(keyword: $kw, page: $page, limit: $limit, sortType: $sort) {
    nodes {
      itemId
      shopId
      productName
      price
      priceMin
      priceMax
      priceDiscountRate
      sales
      imageUrl
      offerLink
      productLink
    }
    pageInfo { page hasNextPage }
  }
}
`

async function fetchKeyword(keyword: string): Promise<any[]> {
  const all: any[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const data = await graphql(SEARCH_QUERY, {
        kw: keyword,
        page,
        limit: ITEMS_PER_PAGE,
        sort: 2, // mais vendidos
      })

      if (data.errors) {
        const msg = data.errors.map((e: any) => e.message).join('; ')
        console.error(`   ⚠️  ${keyword} p${page}: ${msg.slice(0, 100)}`)
        break
      }

      const nodes = data?.data?.productOfferV2?.nodes ?? []
      all.push(...nodes)

      const hasNext = data?.data?.productOfferV2?.pageInfo?.hasNextPage
      if (!hasNext || nodes.length === 0) break

      // Delay para não sobrecarregar a API
      await new Promise((r) => setTimeout(r, 500))
    } catch (e: any) {
      console.error(`   ❌ ${keyword} p${page}: ${e.message?.slice(0, 80)}`)
      break
    }
  }

  return all
}

// ═══════════════════════════════════════════════════════════
// Sanitização de preço (mesma lógica do utils.ts)
// ═══════════════════════════════════════════════════════════

function sanitizePrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0
  let clean = priceStr.replace(/[R$\s]/g, '').trim()
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.')
  } else if (clean.includes('.')) {
    const parts = clean.split('.')
    if (parts[1] && parts[1].length === 3) clean = clean.replace(/\./g, '')
  }
  const v = parseFloat(clean)
  return isNaN(v) ? 0 : v
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 SEED MASSIVO — Shopee: Cordões para Celular')
  console.log('═══════════════════════════════════════════════\n')
  console.log(`📋 Keywords: ${KEYWORDS.length}`)
  console.log(`📄 Páginas por keyword: ${MAX_PAGES} (${ITEMS_PER_PAGE} itens/página)`)
  console.log(`🔢 Máximo teórico: ${KEYWORDS.length * MAX_PAGES * ITEMS_PER_PAGE} produtos\n`)

  let totalFetched = 0
  let totalSaved = 0
  let totalUpdated = 0
  const seen = new Set<string>()

  for (const kw of KEYWORDS) {
    process.stdout.write(`🔍 "${kw}"... `)
    const nodes = await fetchKeyword(kw)
    totalFetched += nodes.length

    let saved = 0
    let updated = 0

    for (const node of nodes) {
      try {
        const itemId = node.itemId
        const shopId = node.shopId
        const title = (node.productName ?? '').trim()

        if (!itemId || !shopId || !title || title.length < 5) continue

        const sourceId = `shopee-${shopId}-${itemId}`

        // Pular duplicados (já processados nesta rodada)
        if (seen.has(sourceId)) continue
        seen.add(sourceId)

        // Preço
        const price = sanitizePrice(node.price) || sanitizePrice(node.priceMin) || 0
        const priceMax = sanitizePrice(node.priceMax) || 0
        let originalPrice = priceMax > price ? priceMax : 0
        let discountPct = node.priceDiscountRate ?? 0

        if (discountPct <= 0 && originalPrice > price && price > 0) {
          discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
        }
        if (originalPrice <= price) {
          originalPrice = Math.round(price * 1.3 * 100) / 100
          discountPct = discountPct || Math.round(((originalPrice - price) / originalPrice) * 100)
        }

        const finalPrice = sanitizePrice(String(price)) || price
        const finalOrigPrice = sanitizePrice(String(originalPrice)) || originalPrice

        if (finalPrice <= 0) continue

        // Imagem
        const imageUrl = node.imageUrl || `https://picsum.photos/seed/${sourceId}/400/400`

        // Link de afiliado
        const affiliateUrl =
          node.offerLink ||
          `https://shopee.com.br/product/${shopId}/${itemId}?affiliate_id=${AFFILIATE_ID}`

        // Upsert no banco
        const existing = await prisma.offer.findFirst({
          where: { sourceId, store: 'shopee' },
        })

        if (existing) {
          await prisma.offer.update({
            where: { id: existing.id },
            data: {
              price: finalPrice,
              originalPrice: finalOrigPrice,
              discountPct,
              imageUrl,
              url: affiliateUrl,
              title: title.slice(0, 250),
              updatedAt: new Date(),
            },
          })
          updated++
        } else {
          await prisma.offer.create({
            data: {
              sourceId,
              title: title.slice(0, 250),
              description: null,
              imageUrl,
              price: finalPrice,
              originalPrice: finalOrigPrice,
              discountPct,
              currency: 'BRL',
              url: affiliateUrl,
              store: 'shopee',
              storeLabel: 'Shopee',
              category: 'Celulares',
              categorySlug: 'celulares',
              installment: finalPrice > 30 ? `12x R$ ${(finalPrice / 12).toFixed(2)}` : null,
              freeShipping: finalPrice > 50,
            },
          })
          saved++
        }
      } catch {
        // skip item
      }
    }

    totalSaved += saved
    totalUpdated += updated
    console.log(`${nodes.length} fetch | ${saved} novos | ${updated} atualizados`)
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log(`📊 Total fetch: ${totalFetched} produtos`)
  console.log(`✅ Salvos: ${totalSaved} novos`)
  console.log(`🔄 Atualizados: ${totalUpdated}`)
  console.log(`📦 Total no banco (Shopee): ${await prisma.offer.count({ where: { store: 'shopee' } })}`)
  console.log('🏁 Concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

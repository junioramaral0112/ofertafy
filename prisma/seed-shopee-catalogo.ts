/**
 * 🚀 SEED CATÁLOGO MASSIVO — Shopee
 * 5 categorias × ~300 produtos cada = ~1500 novos produtos
 *
 * Uso: npx tsx prisma/seed-shopee-catalogo.ts
 */

import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const APP_ID = process.env.SHOPEE_APP_ID || ''
const SECRET = process.env.SHOPEE_SECRET || ''
const AFFILIATE_ID = APP_ID || '18355150568'

if (!APP_ID || !SECRET) {
  console.error('❌ SHOPEE_APP_ID e SHOPEE_SECRET precisam estar no .env')
  process.exit(1)
}

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════════
// Categorias e keywords
// ═══════════════════════════════════════════════════════════

const CATEGORIES: Array<{
  name: string
  slug: string
  keywords: string[]
}> = [
  {
    name: 'Eletrônicos',
    slug: 'eletronicos',
    keywords: [
      'fone bluetooth',
      'carregador celular',
      'cabo usb',
      'headphone',
      'power bank',
      'suporte celular',
      'adaptador tomada',
      'teclado bluetooth',
    ],
  },
  {
    name: 'Casa',
    slug: 'casa',
    keywords: [
      'organizador de gaveta',
      'tapete para sala',
      'luminária led',
      'prateleira flutuante',
      'potes de cozinha',
      'almofada decorativa',
      'quadro decorativo',
      'relógio de parede',
    ],
  },
  {
    name: 'Moda',
    slug: 'moda',
    keywords: [
      'tênis masculino',
      'camiseta básica',
      'moletom masculino',
      'chinelo masculino',
      'boné aba reta',
      'meia cano alto',
      'bolsa feminina',
      'cinto masculino',
    ],
  },
  {
    name: 'Beleza',
    slug: 'beleza',
    keywords: [
      'perfume importado',
      'creme hidratante rosto',
      'kit maquiagem',
      'esmalte em gel',
      'shampoo profissional',
      'escova de cabelo',
      'protetor solar facial',
      'óleo essencial',
    ],
  },
  {
    name: 'Esportes',
    slug: 'esportes',
    keywords: [
      'garrafa de água academia',
      'tapete yoga',
      'luva de musculação',
      'corda de pular',
      'mochila esportiva',
      'camiseta dry fit',
      'bandagem elástica',
      'tornozeleira peso',
    ],
  },
]

const ITEMS_PER_PAGE = 50
const MAX_PAGES = 2

// ═══════════════════════════════════════════════════════════
// GraphQL
// ═══════════════════════════════════════════════════════════

function sign(ts: number, payload: string): string {
  return crypto.createHash('sha256').update(`${APP_ID}${ts}${payload}${SECRET}`).digest('hex')
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

const QUERY = `
query($kw: String!, $page: Int, $limit: Int, $sort: Int) {
  productOfferV2(keyword: $kw, page: $page, limit: $limit, sortType: $sort) {
    nodes {
      itemId shopId productName price priceMin priceMax
      priceDiscountRate imageUrl offerLink productLink
    }
    pageInfo { page hasNextPage }
  }
}
`

async function fetchKeyword(keyword: string): Promise<any[]> {
  const all: any[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const data = await graphql(QUERY, { kw: keyword, page, limit: ITEMS_PER_PAGE, sort: 2 })
      if (data.errors) break
      const nodes = data?.data?.productOfferV2?.nodes ?? []
      all.push(...nodes)
      if (!data?.data?.productOfferV2?.pageInfo?.hasNextPage || nodes.length === 0) break
      await new Promise((r) => setTimeout(r, 400))
    } catch { break }
  }
  return all
}

// ═══════════════════════════════════════════════════════════
// Sanitização
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
    if (parts[1]?.length === 3) clean = clean.replace(/\./g, '')
  }
  const v = parseFloat(clean)
  return isNaN(v) ? 0 : v
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 SEED CATÁLOGO MASSIVO — Shopee')
  console.log('═══════════════════════════════════\n')
  console.log(`📦 Categorias: ${CATEGORIES.length}`)
  console.log(`📋 Keywords por categoria: ${CATEGORIES[0].keywords.length}`)
  console.log(`🔢 Máximo teórico: ${CATEGORIES.length * CATEGORIES[0].keywords.length * MAX_PAGES * ITEMS_PER_PAGE} produtos\n`)

  const globalSeen = new Set<string>()
  let grandTotal = 0

  for (const cat of CATEGORIES) {
    console.log(`\n📂 ${cat.name} (${cat.slug})`)
    console.log('─'.repeat(50))

    let catSaved = 0
    let catUpdated = 0

    for (const kw of cat.keywords) {
      process.stdout.write(`  🔍 "${kw}"... `)
      const nodes = await fetchKeyword(kw)

      let saved = 0
      let updated = 0

      for (const node of nodes) {
        try {
          const itemId = node.itemId
          const shopId = node.shopId
          const title = (node.productName ?? '').trim()
          if (!itemId || !shopId || !title || title.length < 5) continue

          const sourceId = `shopee-${shopId}-${itemId}`
          if (globalSeen.has(sourceId)) continue
          globalSeen.add(sourceId)

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

          const imageUrl = node.imageUrl || `https://picsum.photos/seed/${sourceId}/400/400`
          const affiliateUrl =
            node.offerLink ||
            `https://shopee.com.br/product/${shopId}/${itemId}?affiliate_id=${AFFILIATE_ID}`

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
                category: cat.name,
                categorySlug: cat.slug,
                updatedAt: new Date(),
              },
            })
            updated++
          } else {
            await prisma.offer.create({
              data: {
                sourceId,
                title: title.slice(0, 250),
                imageUrl,
                price: finalPrice,
                originalPrice: finalOrigPrice,
                discountPct,
                currency: 'BRL',
                url: affiliateUrl,
                store: 'shopee',
                storeLabel: 'Shopee',
                category: cat.name,
                categorySlug: cat.slug,
                installment: finalPrice > 30 ? `12x R$ ${(finalPrice / 12).toFixed(2)}` : null,
                freeShipping: finalPrice > 50,
              },
            })
            saved++
          }
        } catch { /* skip */ }
      }

      catSaved += saved
      catUpdated += updated
      console.log(`${nodes.length} fetch | ${saved} novos`)
    }

    grandTotal += catSaved
    console.log(`  📊 ${cat.name}: ${catSaved} novos | ${catUpdated} atualizados`)
  }

  const shopeeTotal = await prisma.offer.count({ where: { store: 'shopee' } })
  const total = await prisma.offer.count()

  console.log('\n═══════════════════════════════════')
  console.log(`✅ ${grandTotal} novos produtos nesta rodada`)
  console.log(`📦 Shopee total: ${shopeeTotal}`)
  console.log(`📦 Todas as lojas: ${total}`)
  console.log('🏁 Catálogo expandido!')
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())

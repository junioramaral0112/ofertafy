/**
 * 👗 SHEIN SCRAPER — Puppeteer + Busca Direta (/pdsearch/)
 *
 * Usa URLs de busca em vez de páginas de departamento.
 * As páginas /pdsearch/ renderizam produtos no DOM (SSR),
 * funcionando para TODAS as categorias (incluindo Moda Masculina,
 * Calçados e Bolsas que as páginas de departamento não renderizam).
 *
 * Puppeteer é usado para aguardar a renderização completa do JS
 * e acionar scroll infinito para carregar mais produtos.
 */

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
}

interface SearchSeed {
  term: string; category: string; categorySlug: string
}

// ═══════════════════════════════════════════════════════════
// 40 TERMOS DE BUSCA — Todas as categorias
// ═══════════════════════════════════════════════════════════

const SEARCH_SEEDS: SearchSeed[] = [
  // ── MODA FEMININA ──────────────────────────
  { term: 'vestido', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'blusa feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'conjunto feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'saia', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'calca feminina', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'shorts feminino', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'moda praia', category: 'Moda Feminina', categorySlug: 'moda-feminina' },
  { term: 'cropped', category: 'Moda Feminina', categorySlug: 'moda-feminina' },

  // ── MODA MASCULINA ─────────────────────────
  { term: 'camiseta masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'camisa masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'calca masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'bermuda masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'camisa social masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'camisa polo masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'moletom masculino', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'jaqueta masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },

  // ── CALÇADOS ───────────────────────────────
  { term: 'tenis feminino', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'tenis masculino', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'tenis casual masculino', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'sandalia feminina', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'bota feminina', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'chinelo', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'sapato social', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'tenis corrida', category: 'Calçados', categorySlug: 'calcados' },

  // ── BOLSAS ─────────────────────────────────
  { term: 'bolsa feminina', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'bolsa tiracolo', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'bolsa transversal', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'mochila', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'carteira feminina', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'bolsa tote', category: 'Bolsas', categorySlug: 'bolsas' },

  // ── INFANTIL ───────────────────────────────
  { term: 'roupa infantil', category: 'Infantil', categorySlug: 'infantil' },
  { term: 'vestido infantil', category: 'Infantil', categorySlug: 'infantil' },
  { term: 'conjunto bebe', category: 'Infantil', categorySlug: 'infantil' },
  { term: 'calcado infantil', category: 'Infantil', categorySlug: 'infantil' },

  // ── BELEZA ─────────────────────────────────
  { term: 'maquiagem', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'base', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'batom', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'blush', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'perfume', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'skincare', category: 'Beleza', categorySlug: 'beleza' },
]

// ═══════════════════════════════════════════════════════════
// FETCH PRINCIPAL
// ═══════════════════════════════════════════════════════════

export async function fetchSheinDealsPuppeteer(config: AffiliateConfig): Promise<RawOffer[]> {
  console.log('👗 SHEIN Puppeteer: iniciando...')
  console.log(`   ${SEARCH_SEEDS.length} termos de busca`)

  const [puppeteer, StealthPlugin] = await Promise.all([
    import('puppeteer-extra'),
    import('puppeteer-extra-plugin-stealth'),
  ])
  puppeteer.default.use(StealthPlugin.default())

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const all: RawOffer[] = []
  const seen = new Set<string>()

  try {
    // Reusa a mesma página para todos os termos (mais rápido)
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1366, height: 768 })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' })

    for (let i = 0; i < SEARCH_SEEDS.length; i++) {
      const seed = SEARCH_SEEDS[i]
      const url = `https://br.shein.com/pdsearch/${encodeURIComponent(seed.term)}/?page=1&sort=7`

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 })

        // Aguardar renderização dos produtos
        await page.waitForSelector('img[src*="ltwebstatic"]', { timeout: 10000 }).catch(() => {})

        // Scroll para carregar mais
        for (let s = 0; s < 3; s++) {
          await page.evaluate(() => window.scrollBy(0, 600))
          await new Promise(r => setTimeout(r, 800))
        }

        const html = await page.content()
        const products = extractProducts(html)

        let termNew = 0
        for (const p of products) {
          if (!seen.has(p.sourceId)) {
            seen.add(p.sourceId)
            all.push({
              ...p,
              category: seed.category,
              categorySlug: seed.categorySlug,
              store: 'shein',
              storeLabel: 'SHEIN',
            })
            termNew++
          }
        }

        console.log(`   ${i + 1}/${SEARCH_SEEDS.length} ${seed.term}: ${termNew} novas (total: ${all.length})`)
      } catch (e: any) {
        console.error(`   ❌ ${seed.term}: ${e.message?.slice(0, 60)}`)
      }

      // Delay entre requisições
      if (i < SEARCH_SEEDS.length - 1) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    await page.close()
  } finally {
    await browser.close()
    console.log('   Navegador fechado')
  }

  console.log(`👗 SHEIN Puppeteer total: ${all.length} ofertas`)
  return all
}

// ═══════════════════════════════════════════════════════════
// EXTRAÇÃO DE PRODUTOS DO DOM
// ═══════════════════════════════════════════════════════════

function extractProducts(html: string): Omit<RawOffer, 'category' | 'categorySlug' | 'store' | 'storeLabel'>[] {
  const results: Omit<RawOffer, 'category' | 'categorySlug' | 'store' | 'storeLabel'>[] = []

  // Extração individual por campo (funciona com pdsearch SSR)
  const ids = [...new Set(Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1]))]
  const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])

  // Tenta flashPrice primeiro (departamento), fallback salePrice (busca)
  let prices = Array.from(html.matchAll(/"flashPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))
  if (prices.length === 0) {
    prices = Array.from(html.matchAll(/"salePrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))
  }

  // Preço original
  let retailPrices = Array.from(html.matchAll(/"retailPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

  for (let i = 0; i < Math.min(ids.length, names.length, prices.length); i++) {
    const id = ids[i]
    const name = names[i]
    const price = prices[i]
    const originalPrice = retailPrices[i] || Math.round(price * 1.4 * 100) / 100

    if (!name || name.length < 3 || !price || price <= 0) continue

    const finalPrice = sanitizePrice(String(price))
    if (finalPrice <= 0) continue

    const finalOrig = sanitizePrice(String(originalPrice))
    const discountPct = finalOrig > finalPrice ? Math.round(((finalOrig - finalPrice) / finalOrig) * 100) : 0
    const imageUrl = imgs[i]?.startsWith('//') ? `https:${imgs[i]}` : (imgs[i] || '')

    results.push({
      sourceId: `shein-${id}`,
      title: name.slice(0, 250),
      description: null,
      imageUrl: imageUrl || `https://picsum.photos/seed/shein-${id}/400/400`,
      price: finalPrice,
      originalPrice: finalOrig,
      discountPct,
      url: `https://br.shein.com/product-p-${id}.html`,
      installment: finalPrice > 40 ? `3x R$ ${(finalPrice / 3).toFixed(2)}` : null,
      freeShipping: finalPrice > 50,
    })
  }

  return results
}

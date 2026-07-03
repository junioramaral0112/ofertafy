/**
 * 👗 SHEIN BRASIL SCRAPER — Via Páginas de Departamento
 *
 * Extrai ofertas das páginas de categoria da SHEIN.
 * Cada departamento retorna 20 produtos por página com paginação real.
 *
 * URLs: br.shein.com/women/, /men/, /kids/, /beauty/
 * Tracking: ID 4292353225
 */

// @ts-nocheck — regex scraping types are not statically analyzable
import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
}

interface DepartmentConfig {
  url: string; category: string; categorySlug: string; maxPages: number
}

// ═══════════════════════════════════════════════════════════
// DEPARTAMENTOS
// ═══════════════════════════════════════════════════════════

const DEPARTMENTS: DepartmentConfig[] = [
  { url: 'https://br.shein.com/women/', category: 'Moda Feminina', categorySlug: 'moda-feminina', maxPages: 20 },
  { url: 'https://br.shein.com/kids/', category: 'Infantil', categorySlug: 'infantil', maxPages: 8 },
]

// Termos de busca para categorias sem suporte a departamentos
interface SearchSeed { term: string; category: string; categorySlug: string }

const SEARCH_SEEDS: SearchSeed[] = [
  { term: 'camiseta masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'camisa social masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'calca jeans masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'bermuda masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'camisa polo masculina', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'moletom masculino', category: 'Moda Masculina', categorySlug: 'moda-masculina' },
  { term: 'tenis casual masculino', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'tenis feminino', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'sandalia feminina', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'bota feminina', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'chinelo', category: 'Calçados', categorySlug: 'calcados' },
  { term: 'bolsa tiracolo', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'bolsa transversal', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'mochila', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'carteira feminina', category: 'Bolsas', categorySlug: 'bolsas' },
  { term: 'maquiagem', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'batom', category: 'Beleza', categorySlug: 'beleza' },
  { term: 'perfume', category: 'Beleza', categorySlug: 'beleza' },
]

const RATE_LIMIT_MS = 500

// ═══════════════════════════════════════════════════════════
// FETCH PRINCIPAL (departamentos + busca)
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════

export async function fetchSheinDeals(config: AffiliateConfig): Promise<RawOffer[]> {
  console.log('👗 SHEIN: busca por departamentos...')
  const all: RawOffer[] = []
  const seen = new Set<string>()

  for (const dept of DEPARTMENTS) {
    console.log(`   🏬 ${dept.category}: até ${dept.maxPages} páginas`)
    let deptTotal = 0

    for (let page = 1; page <= dept.maxPages; page++) {
      try {
        const url = page === 1 ? dept.url : `${dept.url}?page=${page}`
        const products = await scrapeDepartmentPage(url, dept)

        let pageNew = 0
        for (const p of products) {
          if (!seen.has(p.sourceId)) {
            seen.add(p.sourceId)
            all.push(p)
            pageNew++
            deptTotal++
          }
        }

        if (pageNew === 0) break // Sem produtos novos → próximo departamento
        await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
      } catch (e: any) {
        console.error(`      ❌ p${page}: ${e.message?.slice(0, 60)}`)
        break
      }
    }

    console.log(`      ✅ ${deptTotal} ofertas (total: ${all.length})`)
  }

  // ── FASE 2: Busca por termos (categorias sem departamento) ──
  console.log(`\n   🔍 Fase 2: ${SEARCH_SEEDS.length} termos de busca...`)

  for (const seed of SEARCH_SEEDS) {
    try {
      const products = await scrapeDepartmentPage(
        `https://br.shein.com/pdsearch/${encodeURIComponent(seed.term)}/?page=1&sort=7`,
        { category: seed.category, categorySlug: seed.categorySlug } as DepartmentConfig,
      )

      let termNew = 0
      for (const p of products) {
        if (!seen.has(p.sourceId)) {
          seen.add(p.sourceId)
          all.push({ ...p, category: seed.category, categorySlug: seed.categorySlug })
          termNew++
        }
      }

      if (termNew > 0) {
        console.log(`      ${seed.term}: ${termNew} novas (total: ${all.length})`)
      }

      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
    } catch (e: any) {
      // Silencioso — alguns termos podem falhar
    }
  }

  console.log(`👗 SHEIN total: ${all.length} ofertas`)
  return all
}

// ═══════════════════════════════════════════════════════════
// SCRAPER DE PÁGINA DE DEPARTAMENTO
// ═══════════════════════════════════════════════════════════

async function scrapeDepartmentPage(url: string, dept: DepartmentConfig): Promise<RawOffer[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const html = await res.text()
  const offers: RawOffer[] = []

  // Extração individual por campo (ordem não importa)
  const ids = [...new Set(Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1]))]
  const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const flashPrices = Array.from(html.matchAll(/"flashPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))
  const retailPrices = Array.from(html.matchAll(/"retailPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

  for (let i = 0; i < Math.min(ids.length, names.length, flashPrices.length, 20); i++) {
    const id = ids[i]
    const name = names[i]
    const price = flashPrices[i]
    const originalPrice = retailPrices[i] || Math.round(price * 1.4 * 100) / 100

    if (!name || name.length < 3 || !price || price <= 0) continue

    const finalPrice = sanitizePrice(String(price))
    if (finalPrice <= 0) continue

    const finalOrig = sanitizePrice(String(originalPrice))
    const discountPct = finalOrig > finalPrice ? Math.round(((finalOrig - finalPrice) / finalOrig) * 100) : 0
    const imageUrl = imgs[i]?.startsWith('//') ? `https:${imgs[i]}` : (imgs[i] || '')
    const productUrl = `https://br.shein.com/product-p-${id}.html`

    offers.push({
      sourceId: `shein-${id}`,
      title: name.slice(0, 250),
      description: null,
      imageUrl: imageUrl || `https://picsum.photos/seed/shein-${id}/400/400`,
      price: finalPrice,
      originalPrice: finalOrig,
      discountPct,
      url: productUrl,
      store: 'shein',
      storeLabel: 'SHEIN',
      category: dept.category,
      categorySlug: dept.categorySlug,
      installment: finalPrice > 40 ? `3x R$ ${(finalPrice / 3).toFixed(2)}` : null,
      freeShipping: finalPrice > 50,
    })
  }

  return offers
}

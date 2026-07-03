/**
 * 👗 SHEIN SCRAPER — Puppeteer (Renderização Completa)
 *
 * Diferente do scraper fetch-based, este renderiza JavaScript
 * e acessa todos os departamentos (inclusive /men/, /beauty/).
 *
 * Usa Puppeteer + Stealth Plugin para evitar detecção.
 * Isolado em dynamic import (igual Amazon) para não afetar bundle.
 */

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
}

interface DeptConfig {
  url: string; category: string; categorySlug: string; scrolls: number
}

const DEPARTMENTS: DeptConfig[] = [
  { url: 'https://br.shein.com/women/', category: 'Moda Feminina', categorySlug: 'moda-feminina', scrolls: 8 },
  { url: 'https://br.shein.com/men/', category: 'Moda Masculina', categorySlug: 'moda-masculina', scrolls: 6 },
  { url: 'https://br.shein.com/kids/', category: 'Infantil', categorySlug: 'infantil', scrolls: 5 },
  { url: 'https://br.shein.com/beauty/', category: 'Beleza', categorySlug: 'beleza', scrolls: 5 },
]

export async function fetchSheinDealsPuppeteer(config: AffiliateConfig): Promise<RawOffer[]> {
  console.log('👗 SHEIN: iniciando Puppeteer...')

  // Dynamic import — não carrega Puppeteer no bundle de páginas
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
    for (const dept of DEPARTMENTS) {
      console.log(`   🏬 ${dept.category}: renderizando...`)
      const page = await browser.newPage()

      try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
        await page.setViewport({ width: 1366, height: 768 })
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' })

        await page.goto(dept.url, { waitUntil: 'networkidle2', timeout: 30000 })

        // Aguardar renderização dos produtos
        await page.waitForSelector('[data-goods-id], .product-card, .c-image, img[src*="ltwebstatic"]', { timeout: 15000 }).catch(() => {})

        // Scroll para carregar mais produtos (infinite scroll)
        for (let s = 0; s < dept.scrolls; s++) {
          await page.evaluate(() => window.scrollBy(0, 800))
          await new Promise(r => setTimeout(r, 1500))
        }

        // Extrair dados do HTML renderizado
        const html = await page.content()
        const products = extractProducts(html)

        let deptNew = 0
        for (const p of products) {
          if (!seen.has(p.sourceId)) {
            seen.add(p.sourceId)
            all.push({
              ...p,
              category: dept.category,
              categorySlug: dept.categorySlug,
              store: 'shein',
              storeLabel: 'SHEIN',
            })
            deptNew++
          }
        }

        console.log(`      ✅ ${deptNew} ofertas (total: ${all.length})`)
      } catch (e: any) {
        console.error(`      ❌ ${dept.category}: ${e.message?.slice(0, 80)}`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
    console.log('   Navegador fechado')
  }

  console.log(`👗 SHEIN Puppeteer total: ${all.length} ofertas`)
  return all
}

/**
 * Extrai produtos do HTML renderizado pelo Puppeteer.
 * Após renderização JS, o HTML contém os mesmos padrões de dados
 * que encontramos nas páginas server-rendered.
 */
function extractProducts(html: string): Omit<RawOffer, 'category' | 'categorySlug' | 'store' | 'storeLabel'>[] {
  const results: Omit<RawOffer, 'category' | 'categorySlug' | 'store' | 'storeLabel'>[] = []

  // Extração individual por campo (funciona com SSR e SPA renderizado)
  const ids = [...new Set(Array.from(html.matchAll(/"goods_id"\s*:\s*"(\d+)"/g)).map(m => m[1]))]
  const names = Array.from(html.matchAll(/"goods_name"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const imgs = Array.from(html.matchAll(/"goods_img"\s*:\s*"([^"]+)"/g)).map(m => m[1])
  const flashPrices = Array.from(html.matchAll(/"flashPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))
  const retailPrices = Array.from(html.matchAll(/"retailPrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

  // Fallback: search page format (salePrice direto)
  const salePrices = Array.from(html.matchAll(/"salePrice"\s*:\s*\{[^}]*?"amount"\s*:\s*"([^"]+)"/g)).map(m => parseFloat(m[1]))

  const prices = flashPrices.length > 0 ? flashPrices : salePrices

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

import type { AffiliateConfig } from '@/types'
import { sanitizePrice } from '@/lib/utils'
import { mergeSearchTerms, validateOffer } from '@/lib/offer-discovery'

/**
 * 🟠 AMAZON BRASIL SCRAPER
 *
 * Usa Puppeteer + Stealth Plugin em modo headless para
 * simular um navegador real e contornar bloqueios.
 * (Dynamic import para nao quebrar o build do Next.js)
 *
 * Extrai: titulo, preco atual, preco original, imagem, desconto %
 * Links com tag de afiliado (ofertafy00-20)
 */

interface RawOffer {
  sourceId: string; title: string; description: string | null
  imageUrl: string; price: number; originalPrice: number; discountPct: number
  url: string; store: string; storeLabel: string; category: string
  categorySlug: string; installment: string | null; freeShipping: boolean
}

export async function fetchAmazonDeals(config: AffiliateConfig) {
  // Dynamic import — evita carregar Puppeteer durante o build do Next.js
  const [puppeteer, StealthPlugin] = await Promise.all([
    import('puppeteer-extra'),
    import('puppeteer-extra-plugin-stealth'),
  ])
  puppeteer.default.use(StealthPlugin.default())

  const affiliateTag = config.amazonAssociateTag || 'ofertafy00-20'
  const all: RawOffer[] = []

  // Páginas de ofertas da Amazon Brasil
  const urls = [
    'https://www.amazon.com.br/gp/goldbox/',
    'https://www.amazon.com.br/deals?ref_=nav_cs_gb',
  ]

  // 50+ termos de busca em múltiplas categorias
  const searchTerms = [
    'smartphone', 'notebook', 'tv', 'fone-bluetooth', 'aspirador', 'cafeteira',
    'geladeira', 'fogao', 'maquina-lavar', 'microondas', 'air-fryer',
    'ventilador', 'ar-condicionado', 'tablet', 'monitor', 'teclado',
    'mouse-gamer', 'headset', 'caixa-som', 'soundbar', 'ssd', 'memoria-ram',
    'placa-mae', 'gabinete-gamer', 'impressora', 'roteador', 'kindle',
    'camera', 'drone', 'celular', 'smartwatch',
    'tenis-masculino', 'tenis-feminino', 'camiseta', 'calca-jeans',
    'vestido', 'bolsa-feminina', 'mochila', 'relogio',
    'perfume', 'creme-hidratante', 'maquiagem', 'shampoo',
    'furadeira', 'kit-ferramentas', 'bicicleta', 'colchao',
    'cadeira-escritorio', 'mesa', 'panela', 'liquidificador',
    'bebe-brinquedo', 'pet-racao', 'livro',
    'movel-jardim', 'cadeira-praia', 'barraca-camping', 'saco-dormir',
    'lanterna-led', 'halter-academia', 'bicicleta-ergometrica', 'esteira',
    'vara-pesca', 'colchao-inflavel', 'cadeira-dobravel',
    // 🚀 Alta intenção — eletrônicos
    'iphone', 'iphone-16', 'samsung-galaxy', 'xiaomi-redmi', 'motorola-g',
    'smart-tv-4k', 'samsung-tv', 'lg-tv', 'tcl-tv',
    'airpods', 'smartwatch', 'apple-watch',
    'videogame', 'ps5', 'xbox-series', 'nintendo-switch',
    'notebook-gamer', 'notebook-dell', 'notebook-lenovo',
    // 🏠 Casa
    'geladeira-frost-free', 'fogao-cooktop', 'robo-aspirador',
    'cafeteira-nespresso',
    // 👟 Moda
    'tenis-nike', 'tenis-adidas', 'vestido-festa',
    'bolsa-transversal', 'perfume-importado',
  ]

  const allTerms = mergeSearchTerms(searchTerms, { includePromo: true, includePriority: true })
  for (const term of allTerms) {
    urls.push(`https://www.amazon.com.br/s?k=${encodeURIComponent(term)}&s=exact-aware-popularity-rank`)
  }

  console.log('🟠 Amazon: iniciando Puppeteer Stealth...')

  let browser: any = null
  try {
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--window-size=1920,1080',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    })

    const seen = new Set<string>()
    const offersPerUrl: RawOffer[][] = []

    for (const url of urls) {
      try {
        const offers = await scrapeAmazonPage(browser, url, affiliateTag)
        console.log(`   ${url.slice(0, 60)}: ${offers.length} ofertas`)
        offersPerUrl.push(offers)
      } catch (e: any) {
        console.error(`   ❌ ${url.slice(0, 50)}: ${e.message?.slice(0, 80)}`)
        offersPerUrl.push([])
      }
    }

    // Dedup
    for (const offers of offersPerUrl) {
      for (const o of offers) {
        if (!seen.has(o.sourceId)) {
          seen.add(o.sourceId)
          all.push(o)
        }
      }
    }
  } catch (e: any) {
    console.error('Amazon: erro ao iniciar navegador:', e.message)
  } finally {
    if (browser) await browser.close().catch(() => {})
    console.log('   Navegador fechado')
  }

  console.log(`🟠 Amazon total: ${all.length} ofertas`)
  return all
}

async function scrapeAmazonPage(
  browser: any,
  url: string,
  affiliateTag: string
): Promise<RawOffer[]> {
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )

    // Evitar detecção de headless
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] })
      ;(window as any).chrome = { runtime: {} }
    })

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))

    // Scroll para carregar produtos lazy
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let h = 0
        const t = setInterval(() => {
          window.scrollBy(0, 400)
          h += 400
          if (h >= document.body.scrollHeight || h > 3000) { clearInterval(t); resolve() }
        }, 150)
      })
    })
    await new Promise(r => setTimeout(r, 1500))

    // Extrair produtos do DOM renderizado
    const products = await page.evaluate(() => {
      const results: Array<{
        asin: string; title: string; priceText: string; oldPriceText: string
        imageUrl: string; discountPct: number; productUrl: string
      }> = []

      // Seletores da Amazon para cards de produto
      const selectors = [
        '[data-component-type="s-search-result"]',
        '[data-asin]',
        '.s-result-item',
        '.sg-col-inner',
      ]

      let cards: Element[] = []
      for (const sel of selectors) {
        cards = [...document.querySelectorAll(sel)].filter((c) => {
          const asin = c.getAttribute('data-asin')
          return asin && asin.length > 5 && !asin.includes(' ')
        })
        if (cards.length > 0) break
      }

      for (const card of cards) {
        try {
          const asin = card.getAttribute('data-asin') || ''
          if (!asin) continue

          // Titulo
          const titleEl = card.querySelector('h2 a, h2 span, .a-text-normal')
          const title = titleEl?.textContent?.trim() || ''
          if (!title || title.length < 5) continue

          // Preco atual — usa .a-offscreen que traz o valor completo (ex: "R$ 8.890,00")
          const priceEl = card.querySelector('.a-price .a-offscreen')
          const priceText = priceEl?.textContent?.trim() || ''

          // Preco original (riscado)
          const oldPriceEl = card.querySelector('.a-text-price .a-offscreen, [data-a-strike="true"] .a-offscreen')
          const oldPriceText = oldPriceEl?.textContent?.trim() || ''

          // Imagem
          const imgEl = card.querySelector('img.s-image, img[src*="media-amazon"]')
          const imageUrl = imgEl?.getAttribute('src') || ''

          // Desconto
          const discountEl = card.querySelector('.savingsPercentage, .a-color-price')
          const discountText = discountEl?.textContent?.trim() || ''
          const discountMatch = discountText.match(/(\d+)/)
          const discountPct = discountMatch ? parseInt(discountMatch[1]) : 0

          // Precisa ao menos ter um preco
          if (!priceText && !oldPriceText) continue

          results.push({
            asin,
            title,
            priceText,
            oldPriceText,
            imageUrl,
            discountPct,
            productUrl: `https://www.amazon.com.br/dp/${asin}`,
          })
        } catch { /* skip card */ }
      }

      return results
    })

    // Converter para RawOffer aplicando sanitizePrice
    const typed = products as Array<{ asin: string; title: string; priceText: string; oldPriceText: string; imageUrl: string; discountPct: number; productUrl: string }>
    return typed
      .filter((p) => p.title && p.asin)
      .map((p) => {
        const price = sanitizePrice(p.priceText)
        const oldPrice = sanitizePrice(p.oldPriceText)
        const finalOldPrice = oldPrice > price ? oldPrice : Math.round(price * 1.35 * 100) / 100
        const discountPct = p.discountPct > 0 ? p.discountPct
          : (finalOldPrice > price ? Math.round(((finalOldPrice - price) / finalOldPrice) * 100) : 0)

        if (price <= 0) return null // Aceita todos produtos com preço válido

        return {
          sourceId: `amazon-${p.asin}`,
          title: p.title.slice(0, 250),
          description: null,
          imageUrl: p.imageUrl || `https://picsum.photos/seed/amazon-${p.asin}/400/400`,
          price,
          originalPrice: finalOldPrice,
          discountPct,
          url: `https://www.amazon.com.br/dp/${p.asin}?tag=${affiliateTag}`,
          store: 'amazon',
          storeLabel: 'Amazon',
          category: 'Ofertas',
          categorySlug: 'ofertas',
          installment: `12x R$ ${(price / 12).toFixed(2)}`,
          freeShipping: price > 100,
        }
      })
      .filter(Boolean) as RawOffer[]
  } finally {
    await page.close().catch(() => {})
  }
}

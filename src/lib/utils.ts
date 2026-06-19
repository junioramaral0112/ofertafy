export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Converte string de preço brasileira para número decimal.
 * Ex: "R$ 8.890,00" → 8890.0 | "R$ 1.162,99" → 1162.99
 *     "8.890" → 8890 | "44,90" → 44.9 | "10.50" → 10.5
 */
export function sanitizePrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0

  // 1. Remove símbolos de moeda (R$), espaços e quebras de linha
  let cleanStr = priceStr.replace(/[R$\s]/g, '').trim()

  // 2. Se a string contiver pontos e vírgula (Ex: "2.399,00" ou "3.149,10")
  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    // Remove TODOS os pontos de milhar e substitui a vírgula por ponto decimal
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.')
  }
  // 3. Se contiver APENAS vírgula (Ex: "49,90")
  else if (cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(',', '.')
  }
  // 4. Se contiver APENAS ponto (Ex: "2.399" vindo da Amazon sem os centavos do seletor)
  else if (cleanStr.includes('.')) {
    const partes = cleanStr.split('.')
    // Se após o ponto existirem exatamente 3 dígitos, é ponto de milhar (Ex: 2.399 -> 2399)
    if (partes[1] && partes[1].length === 3) {
      cleanStr = cleanStr.replace(/\./g, '')
    }
    // Se tiver 1 ou 2 dígitos, já era ponto decimal padrão (Ex: 10.5 ou 99.99)
  }

  const finalPrice = parseFloat(cleanStr)
  return isNaN(finalPrice) ? 0 : finalPrice
}

export function calculateDiscount(original: number, current: number): number {
  if (original <= 0) return 0
  return Math.round(((original - current) / original) * 100)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Gera URL de afiliado com os parâmetros corretos para cada loja.
 *
 * MERCADO LIVRE → injeta matt_tool=35888960 em TODOS os links
 * MAGALU        → direciona para a loja ofertafy no Magazine Você
 * SHOPEE        → API oficial, ativa quando SHOPEE_APP_ID + SHOPEE_SECRET preenchidos
 * AMAZON        → adormecida, ativa quando AMAZON_ASSOCIATE_TAG for preenchido
 */
export function generateAffiliateUrl(
  productUrl: string,
  store: string,
  config: {
    mlMattTool: string
    magaluStoreId: string
    shopeeAppId?: string
    amazonAssociateTag?: string
    tiktokAffiliateId?: string
  }
): string {
  const url = new URL(productUrl)

  switch (store) {
    case 'mercadolivre':
      // Matt Tool é OBRIGATÓRIO para tracking de afiliado no ML
      url.searchParams.set('matt_tool', config.mlMattTool || '35888960')
      break

    case 'magalu':
      // Magazine Você: loja personalizada do afiliado
      // Formato: https://www.magazinevoce.com.br/magazine{storeId}/produto/...
      // O Magalu redireciona via seu programa de afiliados
      if (config.magaluStoreId) {
        // Se a URL já é do Magazine Você, mantém; senão, prefixa com a loja
        if (!url.hostname.includes('magazinevoce.com.br')) {
          return `https://www.magazinevoce.com.br/magazine${config.magaluStoreId}/`
        }
      }
      break

    case 'shopee':
      // API oficial: usa o App ID como affiliate_id
      if (config.shopeeAppId) {
        url.searchParams.set('affiliate_id', config.shopeeAppId)
      }
      break

    case 'amazon':
      // ADORMECIDA: só ativa quando a tag for preenchida
      if (config.amazonAssociateTag) {
        url.searchParams.set('tag', config.amazonAssociateTag)
      }
      break

    case 'tiktok':
      // Injeta u_code de afiliado + parâmetros UTM
      if (config.tiktokAffiliateId) {
        url.searchParams.set('u_code', config.tiktokAffiliateId)
        url.searchParams.set('utm_source', 'copy')
        url.searchParams.set('utm_medium', 'android')
        url.searchParams.set('utm_campaign', 'client_share')
      }
      break
  }

  return url.toString()
}

/**
 * Garante que a URL tenha https:// no início
 */
function ensureHttps(url: string): string {
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  if (url.startsWith('www.')) return `https://${url}`
  return `https://${url}`
}

/**
 * Constrói link do Mercado Livre SEMPRE com matt_tool=35888960
 */
/**
 * 🔒 Sanitiza QUALQUER URL de afiliado antes de abrir.
 * Resolve: duplicação de domínio, falta de https://, matt_tool ausente.
 * Usar em TODOS os botões "Ver agora" / "Ver oferta".
 */
export function sanitizeAffiliateUrl(rawUrl: string, store: string): string {
  if (!rawUrl) return '#'

  let url = rawUrl.trim()

  // 1) Remove duplicação de domínio (ex: mercadolivre.com.br/www.mercadolivre.com.br/...)
  if (store === 'mercadolivre') {
    // Pega tudo após o ÚLTIMO "mercadolivre.com.br/"
    const parts = url.split('mercadolivre.com.br/')
    const path = parts[parts.length - 1]

    // Reconstrói URL limpa
    url = `https://www.mercadolivre.com.br/${path}`
  }

  // 2) Força https:// se estiver sem protocolo
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    url = `https://${url.replace(/^\/+/, '')}`
  }

  // 3) Substitui http:// por https://
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }

  // 4) Garante tag de afiliado conforme a loja
  if (store === 'mercadolivre' && !url.includes('matt_tool=')) {
    url = url.includes('?') ? `${url}&matt_tool=35888960` : `${url}?matt_tool=35888960`
  }
  if (store === 'amazon' && !url.includes('tag=')) {
    url = url.includes('?') ? `${url}&tag=ofertafy00-20` : `${url}?tag=ofertafy00-20`
  }
  if (store === 'shopee' && !url.includes('affiliate_id=')) {
    // ID de afiliado via API oficial — configurado no .env (SHOPEE_APP_ID)
    url = url.includes('?') ? `${url}&affiliate_id=${process.env.SHOPEE_APP_ID || '18355150568'}` : `${url}?affiliate_id=${process.env.SHOPEE_APP_ID || '18355150568'}`
  }
  if (store === 'tiktok' && !url.includes('u_code=')) {
    const uCode = process.env.TIKTOK_AFFILIATE_ID || 'eif04je11e51h7'
    url = url.includes('?')
      ? `${url}&u_code=${uCode}&utm_source=copy&utm_medium=android&utm_campaign=client_share`
      : `${url}?u_code=${uCode}&utm_source=copy&utm_medium=android&utm_campaign=client_share`
  }

  return url
}

export function buildMercadoLivreLink(permalink: string): string {
  const url = ensureHttps(permalink)
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}matt_tool=35888960`
}

/**
 * Constrói link da Magalu via Magazine Você (loja ofertafy)
 */
export function buildMagaluLink(productId: string, storeId: string = 'ofertafy'): string {
  return `https://www.magazinevoce.com.br/magazine${storeId}/produto/${productId}`
}

export function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `há ${minutes} min`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days} dias`
  return date.toLocaleDateString('pt-BR')
}

export function formatInstallment(price: number, installments: number = 12): string {
  const monthly = price / installments
  return `${installments}x ${formatPrice(monthly)} sem juros`
}

export const CATEGORIES = [
  { name: 'Eletrônicos', slug: 'eletronicos' },
  { name: 'Celulares', slug: 'celulares' },
  { name: 'Informática', slug: 'informatica' },
  { name: 'Moda', slug: 'moda' },
  { name: 'Casa', slug: 'casa' },
  { name: 'Eletrodomésticos', slug: 'eletrodomesticos' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Beleza', slug: 'beleza' },
  { name: 'Brinquedos', slug: 'brinquedos' },
  { name: 'Pets', slug: 'pets' },
  { name: 'Livros', slug: 'livros' },
  { name: 'Automotivo', slug: 'automotivo' },
] as const

/**
 * Lojas ATIVAS (principais):
 * - Mercado Livre (matt_tool=35888960)
 * - Magalu (Magazine Você ofertafy)
 *
 * Lojas ADORMECIDAS (futuras):
 * - Shopee (API oficial, ativa quando SHOPEE_APP_ID + SHOPEE_SECRET preenchidos)
 * - Amazon (ativa quando AMAZON_ASSOCIATE_TAG preenchido)
 */
export const STORES = [
  { name: 'Mercado Livre', slug: 'mercadolivre', color: '#FFE600', active: true },
  { name: 'Magalu',        slug: 'magalu',        color: '#0086FF', active: true },
  { name: 'Amazon',        slug: 'amazon',        color: '#FF9900', active: true },
  { name: 'Shopee',        slug: 'shopee',        color: '#EE4D2D', active: true },
  { name: 'TikTok Shop',   slug: 'tiktok',        color: '#000000', active: true },
] as const

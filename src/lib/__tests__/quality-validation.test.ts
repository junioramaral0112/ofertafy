/**
 * 🧪 TESTES DA POLÍTICA DE QUALIDADE ZERO TOLERÂNCIA
 *
 * Imagem: nunca placeholder genérico — só CDN oficial da loja.
 * URL: sempre a página direta e canônica do produto (sem /busca/, ??, search).
 */
import { describe, expect, it } from 'vitest'
import {
  validateOffer,
  isPlaceholderImageUrl,
  isAllowedStoreImage,
  isCanonicalProductUrl,
} from '../offer-discovery'

const base = {
  title: 'Smartphone Samsung Galaxy A15 128GB 5G Tela 6.5',
  price: 899.9,
  originalPrice: 899.9,
  discountPct: 0,
}

describe('Imagens — rejeição de placeholders', () => {
  it.each([
    'https://picsum.photos/seed/amazon-B0X/400/400',
    'https://unsplash.com/photos/abc',
    'https://via.placeholder.com/400',
    'https://placehold.co/400x400',
    'https://dummyimage.com/400',
    '',
    null,
  ])('rejeita placeholder/imagem vazia: %j', (img) => {
    expect(isPlaceholderImageUrl(img as string)).toBe(true)
  })

  it('aceita CDNs oficiais', () => {
    expect(isPlaceholderImageUrl('https://m.media-amazon.com/images/I/71zplI17EaL._AC_UL320_.jpg')).toBe(false)
    expect(isPlaceholderImageUrl('https://http2.mlstatic.com/D_NQ_NP_123-F.webp')).toBe(false)
    expect(isPlaceholderImageUrl('https://a-static.mlcdn.com.br/400x400/foto.png')).toBe(false)
    expect(isPlaceholderImageUrl('https://cf.shopee.com.br/file/abc123')).toBe(false)
  })

  it('imagem de CDN de OUTRA loja é rejeitada (zero tolerância)', () => {
    // Shopee com imagem do CDN da Amazon
    expect(isAllowedStoreImage('shopee', 'https://m.media-amazon.com/images/I/x.jpg')).toBe(false)
    // Amazon com picsum
    expect(isAllowedStoreImage('amazon', 'https://picsum.photos/seed/x/400/400')).toBe(false)
    // Loja desconhecida rejeita tudo
    expect(isAllowedStoreImage('desconhecida', 'https://m.media-amazon.com/images/I/x.jpg')).toBe(false)
  })

  it('loja certa com CDN certo passa', () => {
    expect(isAllowedStoreImage('amazon', 'https://m.media-amazon.com/images/I/71zplI17EaL._AC_UL320_.jpg')).toBe(true)
    expect(isAllowedStoreImage('mercadolivre', 'https://http2.mlstatic.com/D_NQ_NP_123-F.webp')).toBe(true)
    expect(isAllowedStoreImage('magalu', 'https://a-static.mlcdn.com.br/400x400/foto.png')).toBe(true)
    expect(isAllowedStoreImage('shopee', 'https://cf.shopee.com.br/file/abc')).toBe(true)
  })
})

describe('URLs — rejeição de links sintéticos/quebrados', () => {
  it.each([
    ['amazon', 'https://www.amazon.com.br/s?k=celular'],
    ['amazon', 'https://www.amazon.com.br/dp/B0X??tag=x'],
    ['magalu', 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/123'],
    ['shopee', 'https://shopee.com.br/search?keyword=celular'],
    ['mercadolivre', 'https://www.mercadolivre.com.br/busca/celular'],
    ['amazon', 'https://amazon.com.br/'],
    ['amazon', 'nao-e-url'],
  ])('rejeita URL não-canônica %s: %s', (store, url) => {
    expect(isCanonicalProductUrl(store, url)).toBe(false)
  })

  it.each([
    ['amazon', 'https://www.amazon.com.br/dp/B0FPYV6K68?tag=ofertafy00-20'],
    ['amazon', 'https://www.amazon.com.br/gp/product/B0X'],
    ['mercadolivre', 'https://www.mercadolivre.com.br/p/MLB1234567'],
    ['mercadolivre', 'https://www.mercadolivre.com.br/tv-samsung-50-4k?matt_tool=35888960'],
    ['magalu', 'https://www.magazinevoce.com.br/magazineofertafy/smartphone-samsung-galaxy-a17-256gb'],
    ['shopee', 'https://shopee.com.br/product/98765/123456'],
    ['shopee', 'https://s.shopee.com.br/2gAJ6f0IgW'],
  ])('aceita URL canônica %s: %s', (store, url) => {
    expect(isCanonicalProductUrl(store, url)).toBe(true)
  })
})

describe('validateOffer — política completa', () => {
  it('oferta íntegra passa', () => {
    const r = validateOffer({
      ...base,
      store: 'amazon',
      url: 'https://www.amazon.com.br/dp/B0FPYV6K68?tag=ofertafy00-20',
      imageUrl: 'https://m.media-amazon.com/images/I/71zplI17EaL._AC_UL320_.jpg',
    })
    expect(r.valid).toBe(true)
  })

  it('imagem picsum é rejeitada', () => {
    const r = validateOffer({
      ...base,
      store: 'amazon',
      url: 'https://www.amazon.com.br/dp/B0FPYV6K68',
      imageUrl: 'https://picsum.photos/seed/amazon-B0X/400/400',
    })
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('placeholder')
  })

  it('URL /busca/produto/ da Magalu é rejeitada', () => {
    const r = validateOffer({
      ...base,
      store: 'magalu',
      url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/123',
      imageUrl: 'https://a-static.mlcdn.com.br/400x400/foto.png',
    })
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('url')
  })

  it('imagem de CDN errado é rejeitada', () => {
    const r = validateOffer({
      ...base,
      store: 'shopee',
      url: 'https://shopee.com.br/product/98765/123456',
      imageUrl: 'https://m.media-amazon.com/images/I/x.jpg',
    })
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('CDN')
  })
})

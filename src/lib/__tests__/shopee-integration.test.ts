/**
 * 🧪 TESTE DE INTEGRAÇÃO SHOPEE — buildOffer com nodes sintéticos da API
 *
 * A API oficial exige SHOPEE_APP_ID/SHOPEE_SECRET (não configuradas no
 * Vercel), então o teste cobre a integração com o PRICE EXTRACTION ENGINE
 * usando payloads reais da GraphQL (strings "1899.00", priceMax, discount).
 */
import { describe, expect, it } from 'vitest'
import { buildOffer } from '../affiliates/shopee'

function baseNode(overrides: Record<string, unknown> = {}) {
  return {
    itemId: 123456,
    shopId: 98765,
    productName: 'Smartphone Super Rápido 128GB Tela 6.5',
    shopName: 'Loja Teste',
    price: '899.00',
    priceMin: '849.00',
    priceMax: '1299.00',
    priceDiscountRate: 31,
    imageUrl: 'https://cf.shopee.com.br/file/teste',
    offerLink: 'https://s.shopee.com.br/abc?affiliate_id=123',
    ...overrides,
  }
}

describe('buildOffer (integração Shopee + Price Engine)', () => {
  it('preço principal + desconto declarado real → par correto', () => {
    const offer = buildOffer(baseNode() as any)
    expect(offer).not.toBeNull()
    expect(offer!.price).toBe(899)
    expect(offer!.originalPrice).toBe(1299)
    expect(offer!.discountPct).toBe(31)
  })

  it('sem desconto declarado → originalPrice = price (sem fabricação 1.35x)', () => {
    const offer = buildOffer(baseNode({ priceMax: '899.00', priceDiscountRate: 0 }) as any)
    expect(offer!.price).toBe(899)
    expect(offer!.originalPrice).toBe(899)
    expect(offer!.discountPct).toBe(0)
  })

  it('priceMax menor que price (variações) → ignora como original', () => {
    const offer = buildOffer(baseNode({ priceMax: '700.00', priceDiscountRate: 0 }) as any)
    expect(offer!.price).toBe(899)
    expect(offer!.originalPrice).toBe(899)
    expect(offer!.discountPct).toBe(0)
  })

  it('preço como string com vírgula brasileira é normalizado', () => {
    const offer = buildOffer(baseNode({ price: '1.899,90', priceMax: '2.299,90', priceDiscountRate: 17 }) as any)
    expect(offer!.price).toBe(1899.9)
    expect(offer!.originalPrice).toBe(2299.9)
    expect(offer!.discountPct).toBe(17)
  })

  it('preço inválido → descarta', () => {
    const offer = buildOffer(baseNode({ price: '0' }) as any)
    expect(offer).toBeNull()
  })

  it('sem offerLink nem productLink → fallback não quebra (bug do config corrigido)', () => {
    const offer = buildOffer(baseNode({ offerLink: null, productLink: null }) as any)
    expect(offer).not.toBeNull()
    expect(offer!.url).toContain('affiliate_id=18355150568')
  })
})

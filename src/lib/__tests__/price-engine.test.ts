/**
 * 🧪 TESTES DO PRICE EXTRACTION ENGINE
 *
 * Cobrem os 5 casos obrigatórios do relatório de correção + casos reais
 * capturados do DOM da Amazon (Bifinho Baw Waw, Dreamies, Casco Bovino).
 *
 * Rodar: npm test
 */
import { describe, expect, it } from 'vitest'
import {
  extractMainProductPrice,
  extractPricesFromFreeText,
  normalizeBrazilianPrice,
  sanitizePricePair,
  type PriceCandidate,
} from '../price-engine'

describe('Testes obrigatórios (casos do relatório)', () => {
  it('TESTE 1 — preço principal + preço por kg → usa o principal', () => {
    // Bifinho Baw Waw: R$ 3,39 + (R$ 3.390,00 / kg)
    const pair = extractPricesFromFreeText('R$ 3,39\n(R$ 3.390,00 / kg)')
    expect(pair.price).toBe(3.39)
  })

  it('TESTE 2 — preço principal + preço por litro → usa o principal', () => {
    const pair = extractPricesFromFreeText('R$ 12,90\n(R$ 25,80 / L)')
    expect(pair.price).toBe(12.9)
  })

  it('TESTE 3 — preço à vista + parcelamento → usa o à vista, nunca a parcela', () => {
    const pair = extractPricesFromFreeText('R$ 899,00\n12x R$ 89,90')
    expect(pair.price).toBe(899.0)
  })

  it('TESTE 4 — De/Por promocional → price = Por, originalPrice = De', () => {
    const pair = extractPricesFromFreeText('De R$ 1.299,90\nPor R$ 899,90')
    expect(pair.price).toBe(899.9)
    expect(pair.originalPrice).toBe(1299.9)
  })

  it('TESTE 5 — dois preços sem rótulo → menor é o atual, maior é o original', () => {
    const pair = extractPricesFromFreeText('R$ 1.799,00\nR$ 3.599,00')
    expect(pair.price).toBe(1799.0)
    expect(pair.originalPrice).toBe(3599.0)
  })

  it('TESTE EXTRA — preço principal + preço por unidade → usa o principal', () => {
    const pair = extractPricesFromFreeText('R$ 39,90\nR$ 3,99 / unidade')
    expect(pair.price).toBe(39.9)
  })
})

describe('Casos reais do DOM da Amazon (probe empírico)', () => {
  it('Bifinho Baw Waw 50g — bloco principal + bloco por kg → 3.39', () => {
    const candidates: PriceCandidate[] = [
      { text: 'R$ 3,39', context: 'R$ 3,39R$3,39', source: 'amazon .a-price#1' },
      { text: 'R$ 3.390,00', context: 'R$ 3.390,00R$3.390,00/kg', source: 'amazon .a-price#2' },
    ]
    const pair = extractMainProductPrice(candidates)
    expect(pair.price).toBe(3.39)
    expect(pair.originalPrice).toBe(3.39) // sem preço original real → sem desconto falso
    expect(pair.discountPct).toBe(0)
    expect(pair.rejected.some((r) => r.reason === 'unit')).toBe(true)
  })

  it('Bifinho Baw Waw 300g — R$ 17,90 + (R$ 17.900,00/kg) → 17.90', () => {
    const candidates: PriceCandidate[] = [
      { text: 'R$ 17,90', context: 'R$ 17,90R$17,90', source: 'amazon .a-price#1' },
      { text: 'R$ 17.900,00', context: 'R$ 17.900,00R$17.900,00/kg', source: 'amazon .a-price#2' },
    ]
    const pair = extractMainProductPrice(candidates)
    expect(pair.price).toBe(17.9)
    expect(pair.discountPct).toBe(0)
  })

  it('Dreamies 40g — bloco principal que CONTÉM o texto do por kg → 7.90', () => {
    const candidates: PriceCandidate[] = [
      { text: 'R$ 7,90', context: 'R$ 7,90R$7,90 (R$ 197,50R$197,50/kg)', source: 'amazon .a-price#1' },
      { text: 'R$ 197,50', context: 'R$ 197,50R$197,50/kg', source: 'amazon .a-price#2' },
    ]
    const pair = extractMainProductPrice(candidates)
    expect(pair.price).toBe(7.9)
  })

  it('Casco Bovino — principal + por unidade + riscado → 21.75 / 22.90', () => {
    const candidates: PriceCandidate[] = [
      { text: 'R$ 21,75', context: 'R$ 21,75R$21,75', source: 'amazon .a-price#1' },
      { text: 'R$ 7,25', context: 'R$ 7,25R$7,25/unidade)', source: 'amazon .a-price#2' },
      { text: 'R$ 22,90', context: 'De: R$ 22,90De: R$ 22,90', role: 'original', source: 'amazon strike' },
    ]
    const pair = extractMainProductPrice(candidates)
    expect(pair.price).toBe(21.75)
    expect(pair.originalPrice).toBe(22.9)
    expect(pair.discountPct).toBe(5)
  })

  it('Somente preço por kg no card (sem preço principal) → descarta tudo', () => {
    // Nunca publicar preço por unidade como price
    const pair = extractMainProductPrice([
      { text: 'R$ 3.390,00', context: 'R$ 3.390,00R$3.390,00/kg', source: 'amazon .a-price#1' },
    ])
    expect(pair.price).toBeNull()
    expect(pair.rejected[0]?.reason).toBe('unit')
  })

  it('Biscoito Baw Waw 200g — /kg no ELEMENTO PAI (fora do bloco) → 9.90', () => {
    // Caso real: bloco de referência "R$ 9.900,00" sem /kg dentro do próprio
    // bloco — o "/kg" está no texto do pai "(R$ 9.900,00R$9.900,00/kg)"
    const pair = extractMainProductPrice([
      { text: 'R$ 9,90', context: 'R$ 9,90R$9,90 (R$ 9.900,00R$9.900,00/kg)', source: 'amazon .a-price#1' },
      { text: 'R$ 9.900,00', context: '(R$ 9.900,00R$9.900,00/kg)', source: 'amazon .a-price#2' },
    ])
    expect(pair.price).toBe(9.9)
    expect(pair.originalPrice).toBe(9.9) // sem o falso 80% OFF
    expect(pair.discountPct).toBe(0)
    expect(pair.rejected.some((r) => r.reason === 'unit')).toBe(true)
  })

  it('Osso Palito Baw Waw 100g — referência 10x no pai → 7.90 sem 90% falso', () => {
    const pair = extractMainProductPrice([
      { text: 'R$ 7,90', context: 'R$ 7,90R$7,90 (R$ 79,00R$79,00/kg)', source: 'amazon .a-price#1' },
      { text: 'R$ 79,00', context: '(R$ 79,00R$79,00/kg)', source: 'amazon .a-price#2' },
    ])
    expect(pair.price).toBe(7.9)
    expect(pair.originalPrice).toBe(7.9)
    expect(pair.discountPct).toBe(0)
  })

  it('Biscoito Baw Waw 500g — referência 2x no pai → 17.90 sem 50% falso', () => {
    const pair = extractMainProductPrice([
      { text: 'R$ 17,90', context: 'R$ 17,90R$17,90 (R$ 35,80R$35,80/kg)', source: 'amazon .a-price#1' },
      { text: 'R$ 35,80', context: '(R$ 35,80R$35,80/kg)', source: 'amazon .a-price#2' },
    ])
    expect(pair.price).toBe(17.9)
    expect(pair.originalPrice).toBe(17.9)
    expect(pair.discountPct).toBe(0)
  })

  it('Somente parcela no card → descarta', () => {
    const pair = extractMainProductPrice([{ text: '12x R$ 29,90', source: 'parcela' }])
    expect(pair.price).toBeNull()
    expect(pair.rejected[0]?.reason).toBe('installment')
  })
})

describe('Cenários brasileiros adicionais', () => {
  it('À vista + 12x de — usa o à vista', () => {
    const pair = extractPricesFromFreeText('R$ 899,00 à vista\n12x de R$ 89,90 sem juros')
    expect(pair.price).toBe(899.0)
  })

  it('10x sem juros — usa o preço cheio', () => {
    const pair = extractPricesFromFreeText('R$ 1.299,90\n10x de R$ 129,90 sem juros')
    expect(pair.price).toBe(1299.9)
  })

  it('Texto de economia não vira preço', () => {
    const pair = extractPricesFromFreeText('Economize R$ 1,11 (3%)')
    expect(pair.price).toBeNull()
  })

  it('Por R$ com % off — mantém o preço principal', () => {
    const pair = extractPricesFromFreeText('Por R$ 149,90 (10% off)')
    expect(pair.price).toBe(149.9)
  })

  it('Preço por 100g é rejeitado', () => {
    const pair = extractPricesFromFreeText('R$ 3,99 por 100g')
    expect(pair.price).toBeNull()
  })
})

describe('Normalização brasileira', () => {
  it.each([
    ['R$ 3,39', 3.39],
    ['R$ 1.299,90', 1299.9],
    ['R$ 10.000,00', 10000],
    ['R$ 3.390,00', 3390],
    ['R$ 17.900,00', 17900],
    ['1.299.90', 1299.9],
    ['8.890', 8890],
    ['44,90', 44.9],
    ['10.50', 10.5],
    ['49,99', 49.99],
    ['1899.00', 1899],
    ['0,08', 0.08],
    ['R$ 7,25', 7.25],
  ])('normalizeBrazilianPrice(%j) → %d', (input, expected) => {
    expect(normalizeBrazilianPrice(input)).toBe(expected)
  })

  it('string vazia ou inválida → 0', () => {
    expect(normalizeBrazilianPrice('')).toBe(0)
    expect(normalizeBrazilianPrice(null)).toBe(0)
    expect(normalizeBrazilianPrice('sem preço')).toBe(0)
  })
})

describe('sanitizePricePair (pares numéricos estruturados)', () => {
  it('sem preço original → originalPrice = price e desconto 0 (sem fabricação)', () => {
    const pair = sanitizePricePair(1799, null)
    expect(pair.price).toBe(1799)
    expect(pair.originalPrice).toBe(1799)
    expect(pair.discountPct).toBe(0)
  })

  it('com preço original real → calcula desconto', () => {
    const pair = sanitizePricePair(899.9, 1299.9)
    expect(pair.price).toBe(899.9)
    expect(pair.originalPrice).toBe(1299.9)
    expect(pair.discountPct).toBe(31)
  })

  it('original menor que o atual → ignora o original (dado inconsistente)', () => {
    const pair = sanitizePricePair(21.75, 7.25)
    expect(pair.price).toBe(21.75)
    expect(pair.originalPrice).toBe(21.75)
    expect(pair.discountPct).toBe(0)
  })

  it('preço inválido → par nulo', () => {
    const pair = sanitizePricePair(0, 100)
    expect(pair.price).toBeNull()
  })
})

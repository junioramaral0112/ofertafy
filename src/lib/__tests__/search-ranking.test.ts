/**
 * 🧪 TESTES DO SEARCH RANKING ENGINE
 *
 * Regra de ouro: celulares/TVs reais no TOPO da busca;
 * capinhas, suportes, cabos e acessórios no FINAL.
 */
import { describe, expect, it } from 'vitest'
import {
  detectIntent,
  extractBrand,
  isAccessory,
  isRealPhone,
  isRealTV,
  rankOffers,
  scoreOffer,
  getSynonyms,
  getIntentExpansion,
  getMatchTerms,
  availableBrands,
} from '../search-ranking'

describe('Detecção de intenção', () => {
  it.each([
    ['celular', 'phone'],
    ['celulares', 'phone'],
    ['smartphone', 'phone'],
    ['iphone', 'phone'],
    ['samsung galaxy', 'phone'],
    ['moto g', 'phone'],
    ['tv', 'tv'],
    ['televisao', 'tv'],
    ['smart tv 4k', 'tv'],
    ['tcl tv', 'tv'],
    ['geladeira', 'generic'],
  ])('detectIntent(%j) → %s', (query, expected) => {
    expect(detectIntent(query)).toBe(expected)
  })
})

describe('Detecção de produto real vs acessório', () => {
  it('celular real: título começa com Smartphone', () => {
    expect(isRealPhone('Smartphone Samsung Galaxy A15 128GB')).toBe(true)
  })

  it('celular real: contém smartphone sem "para"', () => {
    expect(isRealPhone('Xiaomi Redmi Note 13 Smartphone 256GB')).toBe(true)
  })

  it('capinha NÃO é celular real', () => {
    expect(isRealPhone('Capa para Smartphone Samsung A15 Silicone')).toBe(false)
    expect(isAccessory('Capa para Smartphone Samsung A15 Silicone')).toBe(true)
  })

  it('película e carregador são acessórios', () => {
    expect(isAccessory('Película 3D para iPhone 15 Pro')).toBe(true)
    expect(isAccessory('Carregador Turbo 33W Xiaomi')).toBe(true)
  })

  it('TV real: título começa com Smart TV', () => {
    expect(isRealTV('Smart TV 50" Samsung 4K UHD')).toBe(true)
  })

  it('TV real: televisor com polegadas + resolução', () => {
    expect(isRealTV('LG 55 Polegadas 4K UHD AI ThinQ')).toBe(true)
  })

  it('suporte para TV NÃO é TV real', () => {
    expect(isRealTV('Suporte para TV 32-70 Polegadas Articulado')).toBe(false)
    expect(isAccessory('Suporte para TV 32-70 Polegadas Articulado')).toBe(true)
  })
})

describe('Ranking — celulares no topo, acessórios no fim', () => {
  const offers = [
    { title: 'Capa para Celular Samsung A15 Transparente', categorySlug: 'acessorios', discountPct: 60, clicks: 10 },
    { title: 'Smartphone Samsung Galaxy A15 128GB 5G', categorySlug: 'celulares', discountPct: 15, clicks: 5 },
    { title: 'Película de Vidro iPhone 15', categorySlug: 'acessorios', discountPct: 50, clicks: 2 },
    { title: 'Moto G84 5G 256GB Azul', categorySlug: 'celulares', discountPct: 10, clicks: 3 },
  ]

  it('celulares reais ficam antes de capinhas/películas mesmo com desconto menor', () => {
    const ranked = rankOffers(offers, 'celular')
    expect(ranked.map((o) => o.title)).toEqual([
      'Smartphone Samsung Galaxy A15 128GB 5G',
      'Moto G84 5G 256GB Azul',
      'Capa para Celular Samsung A15 Transparente',
      'Película de Vidro iPhone 15',
    ])
  })

  it('score de celular real > score de acessório', () => {
    const real = scoreOffer(offers[1], 'celular')
    const capa = scoreOffer(offers[0], 'celular')
    expect(real).toBeGreaterThan(capa)
  })
})

describe('Ranking — TVs no topo, suportes no fim', () => {
  const offers = [
    { title: 'Suporte de Parede para TV 32-60 Polegadas', categorySlug: 'acessorios', discountPct: 40, clicks: 20 },
    { title: 'Smart TV 50" Samsung Crystal 4K', categorySlug: 'tv', discountPct: 20, clicks: 8 },
    { title: 'Cabo HDMI 2.1 8K 2m', categorySlug: 'acessorios', discountPct: 30, clicks: 15 },
    { title: 'Televisão LG 43 Polegadas Full HD Smart', categorySlug: 'eletronicos', discountPct: 12, clicks: 6 },
  ]

  it('TVs reais antes de suportes e cabos', () => {
    const ranked = rankOffers(offers, 'tv')
    expect(ranked[0].title).toContain('Smart TV')
    expect(ranked[1].title).toContain('Televisão LG')
    expect(ranked.map((o) => o.title).indexOf('Suporte de Parede para TV 32-60 Polegadas')).toBeGreaterThan(1)
  })

  it('score de TV real > score de suporte', () => {
    expect(scoreOffer(offers[1], 'tv')).toBeGreaterThan(scoreOffer(offers[0], 'tv'))
  })
})

describe('Marcas', () => {
  it.each([
    ['Smartphone Samsung Galaxy A15', 'Samsung'],
    ['Apple iPhone 15 Pro Max 256GB', 'Apple'],
    ['Xiaomi Redmi Note 13 8GB', 'Xiaomi'],
    ['Motorola Moto G84 5G', 'Motorola'],
    ['Smart TV LG 50 Polegadas', 'LG'],
    ['Smart TV TCL 4K 55"', 'TCL'],
    ['TV Philips Ambilight 50"', 'Philips'],
    ['Geladeira Frost Free 400L', null],
  ])('extractBrand(%j) → %s', (title, expected) => {
    expect(extractBrand(title)).toBe(expected)
  })

  it('availableBrands agrega contagens ordenadas', () => {
    const brands = availableBrands([
      { title: 'Smartphone Samsung Galaxy A15' },
      { title: 'Apple iPhone 15' },
      { title: 'Samsung Galaxy S24 Ultra' },
      { title: 'Capa para Samsung' },
    ])
    expect(brands[0]).toEqual({ name: 'Samsung', count: 3 })
    expect(brands[1]).toEqual({ name: 'Apple', count: 1 })
  })
})

describe('Sinônimos', () => {
  it('celular expande para smartphones e marcas', () => {
    const s = getSynonyms('celular')
    expect(s).toContain('smartphone')
    expect(s).toContain('iphone')
    expect(s).toContain('motorola')
  })

  it('query desconhecida retorna ela mesma', () => {
    expect(getSynonyms('ventilador de teto')).toEqual(['ventilador de teto'])
  })
})

describe('Expansão de intenção (garante aparelhos reais no pool)', () => {
  it('celular inclui smartphone/galaxy/iphone nos termos de match', () => {
    const terms = getMatchTerms('celular')
    expect(terms).toContain('celular')
    expect(terms).toContain('smartphone')
    expect(terms).toContain('galaxy')
    expect(terms).toContain('iphone')
  })

  it('tv inclui smart tv/oled/qled/4k nos termos de match', () => {
    const terms = getMatchTerms('tv')
    expect(terms).toContain('tv')
    expect(terms).toContain('smart tv')
    expect(terms).toContain('oled')
    expect(terms).toContain('4k')
  })

  it('query genérica não expande', () => {
    expect(getIntentExpansion('geladeira')).toEqual([])
  })

  it('brinquedo de celular é acessório (Celular Infantil)', () => {
    expect(isAccessory('Celular Infantil Telefone Interativo Musical')).toBe(true)
    expect(isRealPhone('Celular Infantil Telefone Interativo Musical')).toBe(false)
  })

  it('ventosa/stylus/caneta para celular são acessórios', () => {
    expect(isAccessory('Ventosa Para Celular Dupla de Silicone')).toBe(true)
    expect(isAccessory('Caneta Stylus Touch 2 Em 1 Para Celular')).toBe(true)
  })

  it('luva/touca com "celular" no meio NÃO é celular real', () => {
    expect(isAccessory('Luva Lã Touch Screen Frio Tablet Celular Quentinha Inverno')).toBe(true)
    expect(isRealPhone('Luva Lã Touch Screen Frio Tablet Celular Quentinha Inverno')).toBe(false)
  })

  it('acessório que cita modelo no FINAL não é celular real', () => {
    expect(isRealPhone('Luminária UV Ultravioleta De Mesa Com Garra Presilha Para Manicure Galaxy')).toBe(false)
  })

  it('modelo no INÍCIO do título é celular real', () => {
    expect(isRealPhone('Samsung Galaxy A17 128GB 4GB 50MP Tela 6.7')).toBe(true)
    expect(isRealPhone('Galaxy S24 Ultra 256GB')).toBe(true)
  })

  it('categorySlug "celulares" NÃO torna acessório em celular real (bug do kit ferramenta)', () => {
    expect(isRealPhone('Kit Jogo Ferramenta Chave Magnética Precisão 24 Peças Pequenos Reparos Celular Pc Notebook', 'celulares')).toBe(false)
    expect(isRealPhone('Tripé Selfie para Celular com Luz LED e Controle Bluetooth', 'celulares')).toBe(false)
    expect(isRealPhone('Smartphone Celular Xiaomi Redmi Note 15 4G 256GB', 'celulares')).toBe(true)
  })

  it('categorySlug "tv" NÃO torna suporte em TV real', () => {
    expect(isRealTV('Suporte de Parede para TV 32-60 Polegadas', 'tv')).toBe(false)
    expect(isRealTV('Smart TV 50" Samsung Crystal 4K', 'tv')).toBe(true)
  })
})

describe('Desempate por desconto (mesma relevância)', () => {
  it('com scores iguais, maior desconto vem primeiro', () => {
    const ranked = rankOffers(
      [
        { title: 'Ventilador A', categorySlug: 'casa', discountPct: 10 },
        { title: 'Ventilador B', categorySlug: 'casa', discountPct: 40 },
      ],
      'ventilador'
    )
    expect(ranked[0].title).toBe('Ventilador B')
  })
})

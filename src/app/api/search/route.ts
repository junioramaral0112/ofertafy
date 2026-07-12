import { NextRequest, NextResponse } from 'next/server'
import { searchOffers } from '@/lib/fetcher'

// ═══════════════════════════════════════════════════════════
// SEARCH SYNONYMS ENGINE
// ═══════════════════════════════════════════════════════════

const SYNONYMS: Record<string, string[]> = {
  celular: ['smartphone', 'iphone', 'samsung galaxy', 'motorola', 'xiaomi', 'redmi', 'poco', 'moto g', 'moto edge', 'galaxy s', 'galaxy a'],
  tv: ['smart tv', 'qled', 'oled', 'led', 'samsung tv', 'lg tv', 'tcl', 'philips', 'aoc', '4k', 'televisao', 'televisão'],
  notebook: ['notebook gamer', 'laptop', 'dell', 'acer', 'lenovo', 'asus', 'vaio', 'ultrabook', 'macbook'],
  ps5: ['playstation', 'playstation 5', 'console sony'],
  'air fryer': ['fritadeira eletrica', 'fritadeira elétrica', 'fritadeira sem oleo', 'fritadeira sem óleo'],
  aspirador: ['robo aspirador', 'robô aspirador', 'aspirador de po', 'aspirador de pó'],
  cafeteira: ['cafeteira nespresso', 'cafeteira expresso', 'maquina de cafe', 'máquina de café'],
  geladeira: ['geladeira frost free', 'geladeira inverter', 'refrigerador'],
  tenis: ['tênis', 'tenis nike', 'tenis adidas', 'tenis casual', 'tenis esportivo'],
  perfume: ['perfume importado', 'perfume masculino', 'perfume feminino'],
  vestido: ['vestido festa', 'vestido casual', 'vestido longo'],
  fone: ['fone bluetooth', 'headphone', 'headset', 'airpods', 'fone de ouvido'],
  relogio: ['relógio', 'smartwatch', 'apple watch', 'relogio masculino', 'relógio masculino'],
  maquiagem: ['maquiagem', 'make', 'base', 'batom', 'sombra'],
}

function expandQuery(query: string): string {
  const term = query.toLowerCase().trim()
  // Check if exact match in synonyms
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (term === key || synonyms.some(s => s.toLowerCase() === term)) {
      // Return original term + all synonyms as OR
      const allTerms = [key, ...synonyms]
      return allTerms.join(' OR ')
    }
  }
  return query
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const rawQuery = searchParams.get('q') || ''
  const query = expandQuery(rawQuery)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const store = searchParams.get('store') || undefined
  const category = searchParams.get('category') || undefined
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minDiscount = searchParams.get('minDiscount')
  const freeShipping = searchParams.get('freeShipping')

  const filters = {
    store,
    category,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minDiscount: minDiscount ? parseInt(minDiscount) : undefined,
    freeShipping: freeShipping === '1' || freeShipping === 'true',
  }

  try {
    const data = await searchOffers(query, filters, page, 24)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ofertas', offers: [], total: 0, page, pageSize: 24, totalPages: 0 },
      { status: 500 }
    )
  }
}

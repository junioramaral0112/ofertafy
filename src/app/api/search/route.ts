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

function getSynonyms(query: string): string[] {
  const term = query.toLowerCase().trim()
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (term === key || synonyms.some(s => s.toLowerCase() === term)) {
      return [key, ...synonyms]
    }
  }
  return [query]
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const rawQuery = searchParams.get('q') || ''
  const synonyms = getSynonyms(rawQuery)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const store = searchParams.get('store') || undefined
  const category = searchParams.get('category') || undefined

  try {
    // Busca cada sinonimo individualmente e combina resultados
    const allOffers: any[] = []
    const seen = new Set<string>()

    for (const term of synonyms.slice(0, 6)) { // Limita a 6 buscas
      const data = await searchOffers(term, { store, category }, 1, 12)
      for (const offer of data.offers || []) {
        const key = `${offer.store}|${offer.sourceId || offer.id}`
        if (!seen.has(key)) {
          seen.add(key)
          allOffers.push(offer)
        }
      }
    }

    // Paginate combined results
    const pageSize = 24
    const total = allOffers.length
    const start = (page - 1) * pageSize
    const paged = allOffers.slice(start, start + pageSize)

    return NextResponse.json({
      offers: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ofertas', offers: [], total: 0, page, pageSize: 24, totalPages: 0 },
      { status: 500 }
    )
  }
}

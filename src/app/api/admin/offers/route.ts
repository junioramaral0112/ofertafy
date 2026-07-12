import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromCookie } from '@/lib/auth'

/** Verifica autenticação antes de qualquer operação */
async function checkAuth(): Promise<boolean> {
  const username = await getAuthFromCookie()
  return !!username
}

// GET /api/admin/offers — listar ofertas (filtro opcional por loja)
export async function GET(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const store = request.nextUrl.searchParams.get('store') || ''
  try {
    if (store) {
      // Filtro especifico — retorna ate 200 dessa loja
      const offers = await prisma.offer.findMany({
        where: { store },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      return NextResponse.json({ offers })
    }

    // "Todas" — busca 50 de cada loja e intercala
    const allStores = ['mercadolivre', 'magalu', 'shopee', 'amazon']
    const storeResults = await Promise.all(
      allStores.map(s =>
        prisma.offer.findMany({
          where: { store: s },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      )
    )

    // Intercala: 1 de cada loja
    const offers: any[] = []
    let idx = 0
    while (offers.length < 200 && idx < 50) {
      for (const arr of storeResults) {
        if (arr[idx]) offers.push(arr[idx])
        if (offers.length >= 200) break
      }
      idx++
    }

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar ofertas' }, { status: 500 })
  }
}

// POST /api/admin/offers — criar nova oferta
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  try {
    const body = await request.json()

    // Validação básica
    if (!body.title || !body.url || !body.price) {
      return NextResponse.json({ error: 'Título, URL e Preço são obrigatórios' }, { status: 400 })
    }

    // Se não informou sourceId, gera um automático
    const sourceId = body.sourceId || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const offer = await prisma.offer.create({
      data: {
        title: body.title,
        description: body.description || null,
        imageUrl: body.imageUrl || 'https://picsum.photos/seed/produto/400/400',
        price: parseFloat(body.price),
        originalPrice: parseFloat(body.originalPrice) || parseFloat(body.price) * 1.3,
        discountPct: parseInt(body.discountPct) || 0,
        currency: 'BRL',
        url: body.url,
        store: body.store || 'mercadolivre',
        storeLabel: body.storeLabel || 'Mercado Livre',
        category: body.category || 'Outros',
        categorySlug: body.categorySlug || 'outros',
        installment: body.installment || `12x R$ ${(parseFloat(body.price) / 12).toFixed(2)}`,
        freeShipping: body.freeShipping ?? true,
        isFlash: body.isFlash ?? false,
        flashEndsAt: body.flashEndsAt ? new Date(body.flashEndsAt) : null,
        sourceId,
      },
    })

    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar oferta: ' + String(error) }, { status: 500 })
  }
}

// PUT /api/admin/offers — atualizar oferta existente
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'ID é obrigatório para atualizar' }, { status: 400 })
    }

    const offer = await prisma.offer.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description || null,
        imageUrl: body.imageUrl,
        price: parseFloat(body.price),
        originalPrice: parseFloat(body.originalPrice),
        discountPct: parseInt(body.discountPct) || 0,
        url: body.url,
        store: body.store,
        storeLabel: body.storeLabel,
        category: body.category,
        categorySlug: body.categorySlug,
        installment: body.installment || null,
        freeShipping: body.freeShipping ?? true,
        isFlash: body.isFlash ?? false,
        flashEndsAt: body.flashEndsAt ? new Date(body.flashEndsAt) : null,
        sourceId: body.sourceId || undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, offer })
  } catch (error) {
    console.error('Admin PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar oferta: ' + String(error) }, { status: 500 })
  }
}

// DELETE /api/admin/offers?id=xxx — deletar oferta
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório para deletar' }, { status: 400 })
    }

    // Deletar histórico de preços primeiro
    await prisma.priceHistory.deleteMany({ where: { offerId: id } })
    await prisma.offer.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao deletar oferta' }, { status: 500 })
  }
}

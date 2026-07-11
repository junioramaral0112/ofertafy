import { NextRequest, NextResponse } from 'next/server'
import { fetchAllDeals } from '@/lib/fetch-all-deals'

export const dynamic = 'force-dynamic'

/**
 * BATCHED FETCH — processa 1 loja, 1 lote por chamada.
 *
 * GET /api/fetch?store=magalu&batch=1
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * Cada lote processa ate 8 termos.
 * Timeout seguro para Vercel Hobby (10s).
 */

const VALID_STORES = ['mercadolivre', 'magalu', 'shopee', 'amazon']
const BATCH_SIZE = 8

export async function GET(request: NextRequest) {
  // ── Auth via Bearer ──
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const expected = process.env.CRON_SECRET || ''

  if (expected && token !== expected) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // ── Params ──
  const store = request.nextUrl.searchParams.get('store') || ''
  const batchStr = request.nextUrl.searchParams.get('batch') || '1'
  const batch = parseInt(batchStr, 10)

  if (!store || !VALID_STORES.includes(store)) {
    return NextResponse.json({
      error: `Parametro 'store' obrigatorio. Valores: ${VALID_STORES.join(', ')}`,
    }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    const results = await fetchAllDeals({
      storeFilter: store,
      batchNumber: batch,
      batchSize: BATCH_SIZE,
    })

    const duration = Date.now() - startTime
    const storeResult = results.find((r: any) => r.store?.toLowerCase().replace(/ /g, '') === store)

    const summary = storeResult || {
      store,
      offersFound: 0,
      offersAdded: 0,
      offersUpdated: 0,
      errors: [],
    }

    return NextResponse.json({
      success: true,
      store,
      batch,
      duration_ms: duration,
      terms_in_batch: BATCH_SIZE,
      offers_found: summary.offersFound,
      offers_added: summary.offersAdded,
      offers_updated: summary.offersUpdated,
      errors: (summary.errors || []).slice(0, 5),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      store,
      batch,
      duration_ms: Date.now() - startTime,
      error: error.message?.slice(0, 300),
    }, { status: 500 })
  }
}

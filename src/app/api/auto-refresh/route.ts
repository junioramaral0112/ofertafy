import { NextRequest, NextResponse } from 'next/server'
import { runAutoRefresh } from '@/lib/auto-refresh'

export const dynamic = 'force-dynamic'

/**
 * AUTO-REFRESH — Atualizacao recorrente de ofertas promocionais.
 *
 * GET /api/auto-refresh?store=magalu
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * Foca em sessoes promocionais de cada loja.
 * Desativa produtos que perderam as tags.
 */

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const expected = process.env.CRON_SECRET || ''

  if (expected && token !== expected) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const store = request.nextUrl.searchParams.get('store') || ''

  try {
    const results = await runAutoRefresh(store || undefined)

    const summary = {
      totalFound: results.reduce((s, r) => s + r.dealsFound, 0),
      totalAdded: results.reduce((s, r) => s + r.dealsAdded, 0),
      totalUpdated: results.reduce((s, r) => s + r.dealsUpdated, 0),
      totalDeactivated: results.reduce((s, r) => s + r.dealsDeactivated, 0),
      totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
    }

    return NextResponse.json({
      success: true,
      summary,
      details: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message?.slice(0, 300),
    }, { status: 500 })
  }
}

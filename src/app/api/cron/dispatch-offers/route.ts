import { NextRequest, NextResponse } from 'next/server'
import { dispatchDailyOffers } from '@/services/groupNotifier'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/dispatch-offers
 *
 * Dispara as 3 ofertas diárias para o grupo.
 * Protegida por CRON_SECRET.
 *
 * Headers:
 *   x-cron-secret: <CRON_SECRET>
 *
 * Query params alternativos:
 *   ?secret=<CRON_SECRET>
 *   ?dry-run=true   → apenas formata a mensagem, não envia
 */
export async function GET(request: NextRequest) {
  const secret =
    request.headers.get('x-cron-secret') ??
    request.nextUrl.searchParams.get('secret') ??
    ''

  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Não autorizado. Use ?secret= ou header x-cron-secret' },
      { status: 401 },
    )
  }

  try {
    const result = await dispatchDailyOffers()

    return NextResponse.json({
      success: result.success,
      message: result.message,
      offers: result.offers.map((o) => ({
        store: o.storeLabel,
        title: o.title.slice(0, 80),
        discount: `-${o.discountPct}%`,
        price: o.price,
        url: o.url,
      })),
      webhookResponse: result.webhookResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no dispatch:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno no dispatcher' },
      { status: 500 },
    )
  }
}

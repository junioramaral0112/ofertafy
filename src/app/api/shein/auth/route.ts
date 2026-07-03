import { NextRequest, NextResponse } from 'next/server'
import { exchangeToken, getValidSheinToken } from '@/lib/shein-api/auth'

/**
 * POST /api/shein/auth
 *
 * Troca um tempToken SHEIN por credenciais de acesso.
 *
 * Body: { tempToken: string }
 *
 * Response: { success: true, accessToken, openKeyId, expireIn }
 */
export async function POST(req: NextRequest) {
  try {
    const { tempToken } = await req.json()

    if (!tempToken) {
      return NextResponse.json({ error: 'tempToken é obrigatório' }, { status: 400 })
    }

    const result = await exchangeToken(tempToken)
    if (!result) {
      return NextResponse.json({ error: 'Falha ao trocar token' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      openKeyId: result.openKeyId,
      expireIn: result.expireIn,
    })
  } catch (e: any) {
    console.error('SHEIN auth error:', e.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * GET /api/shein/auth
 *
 * Verifica se há token válido em cache.
 */
export async function GET() {
  const token = await getValidSheinToken()
  if (!token) {
    return NextResponse.json({ valid: false })
  }
  return NextResponse.json({
    valid: true,
    expiresAt: new Date(token.expiresAt).toISOString(),
  })
}

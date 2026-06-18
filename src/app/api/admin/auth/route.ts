import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie, clearAuthCookie, validateCredentials, getAuthFromCookie } from '@/lib/auth'

/**
 * POST /api/admin/auth — Login
 * Body: { username, password }
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios' },
        { status: 400 },
      )
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 },
      )
    }

    await setAuthCookie(username)

    return NextResponse.json({ success: true, username })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/auth — Logout
 */
export async function DELETE() {
  await clearAuthCookie()
  return NextResponse.json({ success: true })
}

/**
 * GET /api/admin/auth — Verificar sessão
 */
export async function GET() {
  const username = await getAuthFromCookie()

  if (!username) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, username })
}

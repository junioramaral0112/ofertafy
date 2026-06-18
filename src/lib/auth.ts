/**
 * 🔒 Autenticação do Painel Admin
 *
 * Usa token assinado via HMAC-SHA256 armazenado em cookie httpOnly.
 * Sem dependências externas — apenas crypto nativo do Node.js.
 *
 * Configuração:
 *   ADMIN_USER=seu_usuario
 *   ADMIN_PASSWORD=sua_senha
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'ofertafy_admin_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

// ---------------------------------------------------------------------------
// Token (HMAC-SHA256)
// ---------------------------------------------------------------------------

function getSecret(): string {
  return process.env.CRON_SECRET || process.env.ADMIN_PASSWORD || 'default-secret'
}

export function createToken(username: string): string {
  const payload = `${username}:${Date.now()}`
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex')
  return `${payload}:${signature}`
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split(':')
    if (parts.length !== 3) return null

    const [username, timestamp, signature] = parts

    // Verifica se o token não expirou (30 dias)
    const ts = parseInt(timestamp)
    if (Date.now() - ts > COOKIE_MAX_AGE * 1000) return null

    // Verifica assinatura
    const payload = `${username}:${timestamp}`
    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null
    }

    return username
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Cookie (Next.js App Router)
// ---------------------------------------------------------------------------

export async function setAuthCookie(username: string) {
  const token = createToken(username)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getAuthFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ---------------------------------------------------------------------------
// Validação de credenciais
// ---------------------------------------------------------------------------

export function validateCredentials(
  username: string,
  password: string,
): boolean {
  const expectedUser = process.env.ADMIN_USER
  const expectedPass = process.env.ADMIN_PASSWORD

  if (!expectedUser || !expectedPass) {
    // Em dev sem config: aceita qualquer login
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  ADMIN_USER/ADMIN_PASSWORD não configurados — login liberado em dev')
      return username.length >= 3 && password.length >= 3
    }
    return false
  }

  return username === expectedUser && password === expectedPass
}

/**
 * 🔐 SHEIN OPEN API — Autenticação
 *
 * Implementa o fluxo oficial de assinatura HMAC-SHA256 e troca de tokens
 * conforme documentação da Open API da SHEIN.
 *
 * Fluxo:
 *   1. Gerar assinatura com appSecret
 *   2. Trocar tempToken por accessToken via get-by-token
 *   3. Descriptografar a secretKey retornada
 *   4. Usar accessToken + secretKey nas chamadas subsequentes
 */

import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════
// CREDENCIAIS (ambiente)
// ═══════════════════════════════════════════════════════════

const SHEIN_APP_KEY = process.env.SHEIN_APP_KEY || ''
const SHEIN_APP_SECRET = process.env.SHEIN_APP_SECRET || ''
const SHEIN_OPEN_API_BASE = 'https://openapi.sheincorp.com'

// ═══════════════════════════════════════════════════════════
// GERAÇÃO DE ASSINATURA
// ═══════════════════════════════════════════════════════════

/**
 * Gera a assinatura HMAC-SHA256 para autenticação na Open API da SHEIN.
 *
 * Algoritmo (documentação oficial):
 *   1. Concatena: OpenKeyId + "&" + Timestamp + "&" + Path
 *   2. Concatena: SecretKey + RandomKey
 *   3. HMAC-SHA256 com a chave do passo 2 sobre a mensagem do passo 1
 *   4. Converte o hash para hex, depois para Base64
 *   5. Retorna: randomKey + Base64
 *
 * @param path       Caminho da API (ex: "/open-api/auth/get-by-token")
 * @param timestamp  Timestamp Unix em milissegundos
 * @param openKeyId  ID da chave pública (appKey)
 * @param secretKey  Chave secreta para assinatura
 * @param randomKey  Chave aleatória de 32 bytes (hex)
 * @returns Assinatura no formato: randomKey + Base64(HMAC-SHA256)
 */
export function generateSheinSignature(
  path: string,
  timestamp: number,
  openKeyId: string,
  secretKey: string,
  randomKey: string,
): string {
  // Passo 1: Mensagem = OpenKeyId & Timestamp & Path
  const message = `${openKeyId}&${timestamp}&${path}`

  // Passo 2: Chave = SecretKey + RandomKey
  const signingKey = secretKey + randomKey

  // Passo 3: HMAC-SHA256 → hex → Base64
  const hmac = crypto.createHmac('sha256', signingKey)
  hmac.update(message)
  const hexDigest = hmac.digest('hex')
  const base64 = Buffer.from(hexDigest, 'hex').toString('base64')

  // Passo 4: Retorna randomKey + resultado
  return `${randomKey}${base64}`
}

// ═══════════════════════════════════════════════════════════
// HEADERS DE AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════

interface SheinAuthHeaders {
  'x-open-key-id': string
  'x-open-timestamp': string
  'x-open-signature': string
  'Content-Type': string
}

/**
 * Gera os headers de autenticação para qualquer chamada da Open API.
 *
 * @param path       Caminho da API
 * @param openKeyId  ID da chave (appKey ou accessToken)
 * @param secretKey  Chave secreta (appSecret ou secretKey da resposta)
 */
export function buildSheinAuthHeaders(
  path: string,
  openKeyId: string,
  secretKey: string,
): SheinAuthHeaders {
  const timestamp = Date.now()
  const randomKey = crypto.randomBytes(32).toString('hex')
  const signature = generateSheinSignature(path, timestamp, openKeyId, secretKey, randomKey)

  return {
    'x-open-key-id': openKeyId,
    'x-open-timestamp': String(timestamp),
    'x-open-signature': signature,
    'Content-Type': 'application/json',
  }
}

// ═══════════════════════════════════════════════════════════
// TROCA DE TOKENS
// ═══════════════════════════════════════════════════════════

interface TokenResponse {
  code: number
  message?: string
  data?: {
    accessToken?: string
    refreshToken?: string
    secretKey?: string    // Criptografada com appSecret
    expireIn?: number
    openKeyId?: string
  }
}

/**
 * Descriptografa a secretKey retornada pela SHEIN.
 *
 * A SHEIN retorna a secretKey criptografada com AES usando a appSecret.
 * Descriptografamos para obter a chave real que será usada nas chamadas.
 *
 * @param encryptedSecretKey  Secret key criptografada (hex)
 * @param appSecretKey        Chave secreta do app (usada como chave AES)
 */
function decryptSecretKey(encryptedSecretKey: string, appSecretKey: string): string {
  try {
    // A SHEIN usa AES-128-ECB com a appSecret como chave
    // A chave AES deve ter 16 bytes — usa os primeiros 16 chars do MD5 da appSecret
    const key = crypto.createHash('md5').update(appSecretKey).digest()

    const encrypted = Buffer.from(encryptedSecretKey, 'hex')
    const decipher = crypto.createDecipheriv('aes-128-ecb', key, null)
    decipher.setAutoPadding(true)

    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  } catch (e: any) {
    console.error('SHEIN decryptSecretKey error:', e.message)
    // Fallback: retorna a appSecret se a descriptografia falhar
    return appSecretKey
  }
}

/**
 * Troca um token temporário (tempToken) por credenciais de acesso.
 *
 * Endpoint: POST /open-api/auth/get-by-token
 *
 * Regra importante da documentação:
 *   Para esta chamada ESPECÍFICA, a assinatura usa as credenciais do app
 *   (appKey + appSecret), NÃO o tempToken. O tempToken vai no body.
 *
 * @param tempToken  Token temporário obtido do fluxo OAuth da SHEIN
 */
export async function exchangeToken(tempToken: string): Promise<{
  accessToken: string
  secretKey: string
  openKeyId: string
  expireIn: number
} | null> {
  const path = '/open-api/auth/get-by-token'
  const url = `${SHEIN_OPEN_API_BASE}${path}`

  console.log('🔐 SHEIN: trocando tempToken por accessToken...')

  try {
    // Para get-by-token, a assinatura usa as credenciais do APP
    const headers = buildSheinAuthHeaders(path, SHEIN_APP_KEY, SHEIN_APP_SECRET)

    const body = JSON.stringify({ tempToken })

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    })

    const data: TokenResponse = await res.json()

    if (data.code !== 0 || !data.data?.accessToken) {
      console.error('SHEIN token exchange failed:', data.code, data.message)
      return null
    }

    const { accessToken, secretKey: encryptedKey, openKeyId, expireIn } = data.data

    // Descriptografar a secretKey usando a appSecret
    const decryptedSecret = encryptedKey
      ? decryptSecretKey(encryptedKey, SHEIN_APP_SECRET)
      : SHEIN_APP_SECRET

    console.log('✅ SHEIN: token obtido com sucesso')

    return {
      accessToken: accessToken!,
      secretKey: decryptedSecret,
      openKeyId: openKeyId || SHEIN_APP_KEY,
      expireIn: expireIn || 7200,
    }
  } catch (e: any) {
    console.error('SHEIN exchangeToken error:', e.message)
    return null
  }
}

// ═══════════════════════════════════════════════════════════
// CACHE DE TOKEN (em memória — MVP)
// ═══════════════════════════════════════════════════════════

let cachedToken: {
  accessToken: string
  secretKey: string
  openKeyId: string
  expiresAt: number
} | null = null

/**
 * Obtém credenciais válidas (usa cache ou renova).
 */
export async function getValidSheinToken(tempToken?: string) {
  // Cache válido?
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken
  }

  // Sem tempToken → não podemos renovar
  if (!tempToken) {
    if (cachedToken) return cachedToken // Usa expirado como fallback
    return null
  }

  const result = await exchangeToken(tempToken)
  if (!result) return null

  cachedToken = {
    accessToken: result.accessToken,
    secretKey: result.secretKey,
    openKeyId: result.openKeyId,
    expiresAt: Date.now() + result.expireIn * 1000,
  }

  return cachedToken
}

// ═══════════════════════════════════════════════════════════
// CHAMADA GENÉRICA À OPEN API
// ═══════════════════════════════════════════════════════════

/**
 * Faz uma chamada autenticada a qualquer endpoint da Open API da SHEIN.
 *
 * @param path    Caminho da API (ex: "/open-api/product/list")
 * @param body    Corpo da requisição (opcional)
 * @param method  Método HTTP (default: POST)
 */
export async function callSheinOpenApi(
  path: string,
  body?: Record<string, unknown>,
  method: 'GET' | 'POST' = 'POST',
): Promise<any> {
  const token = cachedToken
  if (!token || token.expiresAt <= Date.now()) {
    throw new Error('SHEIN token expirado. Renove com tempToken.')
  }

  const headers = buildSheinAuthHeaders(path, token.openKeyId, token.secretKey)
  const url = `${SHEIN_OPEN_API_BASE}${path}`

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  })

  return res.json()
}

/**
 * 🔍 Diagnóstico da API Shopee (v2)
 * Testa múltiplas base URLs, formatos de assinatura e endpoints
 *
 * Uso: npx tsx src/scripts/test-shopee-api.ts
 */

import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════
// Carrega .env manualmente
// ═══════════════════════════════════════════════════════════

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '..', '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    let key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const APP_ID = process.env.SHOPEE_APP_ID || ''
const SECRET = process.env.SHOPEE_SECRET || ''

if (!APP_ID || !SECRET) {
  console.error('❌ SHOPEE_APP_ID ou SHOPEE_SECRET não configurados no .env')
  process.exit(1)
}

console.log('🔑 APP_ID:', APP_ID)
console.log('🔑 SECRET:', SECRET.slice(0, 4) + '...' + SECRET.slice(-4))
console.log('')

// ═══════════════════════════════════════════════════════════
// Variações de assinatura
// ═══════════════════════════════════════════════════════════

function signV1(path: string, timestamp: number): string {
  // partner_id + timestamp
  return crypto.createHmac('sha256', SECRET).update(`${APP_ID}${timestamp}`).digest('hex')
}

function signV2(path: string, timestamp: number): string {
  // partner_id + path + timestamp
  return crypto.createHmac('sha256', SECRET).update(`${APP_ID}${path}${timestamp}`).digest('hex')
}

function signV3(path: string, timestamp: number): string {
  // path + timestamp (sem partner_id)
  return crypto.createHmac('sha256', SECRET).update(`${path}${timestamp}`).digest('hex')
}

// ═══════════════════════════════════════════════════════════
// Chamada à API
// ═══════════════════════════════════════════════════════════

type AuthMode = 'query' | 'body'
type SignMode = 'v1' | 'v2' | 'v3'

async function callApi(
  baseUrl: string,
  path: string,
  params: Record<string, unknown>,
  authMode: AuthMode,
  signMode: SignMode,
  method: 'POST' | 'GET' = 'POST',
): Promise<{ status: number; body: unknown }> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signFn = signMode === 'v1' ? signV1 : signMode === 'v2' ? signV2 : signV3

  let url = `${baseUrl}${path}`
  let reqBody: string | undefined

  if (authMode === 'query') {
    const authParams = new URLSearchParams({
      partner_id: APP_ID,
      timestamp: String(timestamp),
      sign: signFn(path, timestamp),
    })
    url += `?${authParams.toString()}`
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const bodyObj: Record<string, unknown> = { ...params }

  if (authMode === 'body') {
    bodyObj.partner_id = Number(APP_ID)
    bodyObj.timestamp = timestamp
    bodyObj.sign = signFn(path, timestamp)
  }

  if (method === 'POST' && Object.keys(bodyObj).length > 0) {
    reqBody = JSON.stringify(bodyObj)
  }

  console.log(`   ${method} ${url.slice(0, 180)}`)
  if (reqBody) console.log(`   body: ${reqBody.slice(0, 250)}`)

  const res = await fetch(url, { method, headers, body: reqBody })
  const text = await res.text()
  let json: unknown = text
  try { json = JSON.parse(text) } catch { /* raw */ }

  return { status: res.status, body: json }
}

// ═══════════════════════════════════════════════════════════
// Teste de endpoint individual
// ═══════════════════════════════════════════════════════════

async function testEndpoint(
  label: string,
  baseUrl: string,
  path: string,
  params: Record<string, unknown>,
) {
  console.log(`\n🔬 ${label}`)
  console.log(`   URL base: ${baseUrl}`)
  console.log(`   Path: ${path}`)

  for (const authMode of ['query', 'body'] as AuthMode[]) {
    for (const signMode of ['v1', 'v2', 'v3'] as SignMode[]) {
      try {
        const { status, body } = await callApi(baseUrl, path, params, authMode, signMode)
        const summary = JSON.stringify(body).slice(0, 200)

        if (status === 200 && !summary.includes('"error"')) {
          console.log(`   ✅ auth=${authMode} sign=${signMode} HTTP${status}`)
          console.log(`      ${JSON.stringify(body).slice(0, 400)}`)
          return true // sucesso — para de testar
        } else {
          const errTag = (body as any)?.error || 'error'
          console.log(`   ❌ auth=${authMode} sign=${signMode} → ${errTag}`)
        }
      } catch (e: any) {
        console.log(`   💥 auth=${authMode} sign=${signMode} → ${e.message?.slice(0, 60)}`)
      }
    }
  }
  return false
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('🔍 DIAGNÓSTICO DA API SHOPEE (V2)')
  console.log('══════════════════════════════════\n')

  // Lista de combinações base URL + path para testar
  const tests: Array<{ label: string; baseUrl: string; path: string; params: Record<string, unknown> }> = [

    // Partner API (global)
    {
      label: 'Partner global — auth',
      baseUrl: 'https://partner.shopeemobile.com',
      path: '/api/v2/shop/auth_partner',
      params: {},
    },
    {
      label: 'Partner global — search_item',
      baseUrl: 'https://partner.shopeemobile.com',
      path: '/api/v2/product/search_item',
      params: { keyword: 'smartphone', offset: 0, page_size: 3, sort_type: 'sales' },
    },

    // Partner API Brasil
    {
      label: 'Partner BR — auth',
      baseUrl: 'https://partner.shopee.com.br',
      path: '/api/v2/shop/auth_partner',
      params: {},
    },
    {
      label: 'Partner BR — search_item',
      baseUrl: 'https://partner.shopee.com.br',
      path: '/api/v2/product/search_item',
      params: { keyword: 'smartphone', offset: 0, page_size: 3, sort_type: 'sales' },
    },

    // Afiliado (subdomínio comum)
    {
      label: 'Affiliate API — link_generate',
      baseUrl: 'https://affiliate.shopeemobile.com',
      path: '/api/v2/affiliate/link_generate',
      params: { url: 'https://shopee.com.br/product/123/456' },
    },

    // API Brasil genérica
    {
      label: 'Shopee BR API — search',
      baseUrl: 'https://api.shopee.com.br',
      path: '/api/v2/product/search_item',
      params: { keyword: 'smartphone', offset: 0, page_size: 3 },
    },
  ]

  let anySuccess = false

  for (const test of tests) {
    const ok = await testEndpoint(test.label, test.baseUrl, test.path, test.params)
    if (ok) anySuccess = true
  }

  console.log('\n══════════════════════════════════')
  if (anySuccess) {
    console.log('✅ Pelo menos um formato funcionou!')
  } else {
    console.log('⚠️  Nenhum formato funcionou.')
    console.log('')
    console.log('Possíveis causas:')
    console.log('  1. As credenciais são do Programa de Afiliados (não Open Platform)')
    console.log('  2. O Partner ID precisa ser ativado primeiro no painel')
    console.log('  3. O IP precisa estar na whitelist do app')
    console.log('  4. A API de afiliados usa um formato completamente diferente')
  }
}

main().catch((e) => {
  console.error('❌ Erro:', e.message)
  process.exit(1)
})

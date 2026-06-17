/**
 * 🔍 Diagnóstico da API GraphQL de Afiliados Shopee
 *
 * Testa:
 *   1. Autenticação (assinatura HMAC com payload)
 *   2. Variações do nome da query (productOfferV2, offerList, etc.)
 *   3. Introspection do schema
 *
 * Uso: npx tsx src/scripts/test-shopee-graphql.ts
 */

import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

// ═════════════════════════════════════════════════════
// Carrega .env
// ═════════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════════
// Variações de assinatura
// ═════════════════════════════════════════════════════

function signHmacPayload(secret: string, appId: string, ts: number, payload: string): string {
  const base = `${appId}${ts}${payload}`
  return crypto.createHmac('sha256', secret).update(base).digest('hex')
}

function signHmacNoPayload(secret: string, appId: string, ts: number, _payload: string): string {
  const base = `${appId}${ts}`
  return crypto.createHmac('sha256', secret).update(base).digest('hex')
}

function signPlainHash(secret: string, appId: string, ts: number, payload: string): string {
  const base = `${appId}${ts}${payload}${secret}`
  return crypto.createHash('sha256').update(base).digest('hex')
}

// ═════════════════════════════════════════════════════
// Chamada GraphQL
// ═════════════════════════════════════════════════════

async function callGraphQL(
  query: string,
  variables: Record<string, unknown>,
  signFn: (secret: string, appId: string, ts: number, payload: string) => string,
  label: string,
): Promise<{ status: number; body: unknown }> {
  const ts = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({ query, variables })
  const sig = signFn(SECRET, APP_ID, ts, body)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `SHA256 Credential=${APP_ID}, Timestamp=${ts}, Signature=${sig}`,
  }

  console.log(`   📡 sign=${label}`)
  console.log(`      Authorization: SHA256 Credential=${APP_ID}, Timestamp=${ts}, Signature=${sig.slice(0, 16)}...`)
  console.log(`      body: ${body.slice(0, 250)}`)

  try {
    const res = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    })

    const text = await res.text()
    let json: unknown = text
    try { json = JSON.parse(text) } catch { /* raw */ }

    return { status: res.status, body: json }
  } catch (e: any) {
    return { status: 0, body: { error: e.message } }
  }
}

// ═════════════════════════════════════════════════════
// Testes
// ═════════════════════════════════════════════════════

async function testQuery(
  queryName: string,
  queryStr: string,
  variables: Record<string, unknown>,
) {
  console.log(`\n🔬 Query: ${queryName}`)

  for (const signFn of [signHmacPayload, signHmacNoPayload, signPlainHash]) {
    const label = signFn === signHmacPayload ? 'hmac+payload' :
                  signFn === signHmacNoPayload ? 'hmac-no-payload' : 'plain-hash'

    const { status, body } = await callGraphQL(queryStr, variables, signFn, label)
    const summary = JSON.stringify(body).slice(0, 500)

    const hasError = (body as any)?.errors || (body as any)?.error
    const hasData = (body as any)?.data && !hasError

    if (hasData) {
      console.log(`   ✅ HTTP ${status} sign=${label} — SUCESSO!`)
      console.log(`      ${summary.slice(0, 600)}`)
      return true
    } else {
      const errInfo = hasError
        ? JSON.stringify((body as any).errors ?? (body as any).error).slice(0, 120)
        : `HTTP ${status}`
      console.log(`   ❌ sign=${label} → ${errInfo}`)
    }
  }
  return false
}

// ═════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════

async function main() {
  console.log('🔍 DIAGNÓSTICO GRAPHQL SHOPEE AFILIADOS')
  console.log('═══════════════════════════════════════\n')

  // --- Introspection ---
  console.log('── Schema Introspection ──')
  await testQuery(
    'IntrospectionQuery',
    `query { __schema { types { name kind } } }`,
    {},
  )

  // --- Variações de nome da query de produtos ---
  console.log('\n── Query de produtos (nome: productOfferV2) ──')
  await testQuery(
    'productOfferV2',
    `query($kw:[String!]!,$max:Int,$sort:Int){productOfferV2(keywords:$kw,maxResults:$max,sortType:$sort){nodes{itemId,shopId,name,priceMin,priceMax,price,discountPct,sales,rating,commissionRate,commission,offerLink,shortLink,imageUrl,image,images,categories{categoryId,displayName}}pageInfo{scrollId,hasNextPage}totalCount}}`,
    { kw: ['smartphone'], max: 5, sort: 2 },
  )

  console.log('\n── Query de produtos (nome: offerList) ──')
  await testQuery(
    'offerList',
    `query($kw:[String!]!,$max:Int,$sort:Int){offerList(keywords:$kw,maxResults:$max,sortType:$sort){nodes{itemId,shopId,name,priceMin,priceMax,price,discountPct,sales,rating,commissionRate,commission,offerLink,shortLink,imageUrl,image,images,categories{categoryId,displayName}}pageInfo{scrollId,hasNextPage}totalCount}}`,
    { kw: ['smartphone'], max: 5, sort: 2 },
  )

  console.log('\n── Query de produtos (nome: products) ──')
  await testQuery(
    'products',
    `query($kw:[String!]!,$max:Int,$sort:Int){products(keywords:$kw,maxResults:$max,sortType:$sort){nodes{itemId,shopId,name,priceMin,priceMax,price,discountPct,sales,rating,commissionRate,commission,offerLink,shortLink,imageUrl,image,images,categories{categoryId,displayName}}pageInfo{scrollId,hasNextPage}totalCount}}`,
    { kw: ['smartphone'], max: 5, sort: 2 },
  )

  console.log('\n═══════════════════════════════════════')
  console.log('✅ Diagnóstico concluído')
}

main().catch((e) => {
  console.error('❌ Erro:', e.message)
  process.exit(1)
})

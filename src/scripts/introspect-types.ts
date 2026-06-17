/**
 * Introspecção SIMPLES (sem inline fragments)
 * Uso: npx tsx src/scripts/introspect-types.ts
 */

import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

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

function sign(ts: number, payload: string): string {
  return crypto.createHash('sha256').update(`${APP_ID}${ts}${payload}${SECRET}`).digest('hex')
}

async function gql(query: string): Promise<any> {
  const ts = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({ query })
  const sig = sign(ts, body)
  const res = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `SHA256 Credential=${APP_ID}, Timestamp=${ts}, Signature=${sig}`,
    },
    body,
    signal: AbortSignal.timeout(15000),
  })
  return res.json()
}

async function main() {
  // Step 1: Pegar TODOS os nomes de tipos primeiro
  console.log('── Todos os tipos ──')
  const allTypes = await gql(`{ __schema { types { name kind } } }`)
  const types = allTypes?.data?.__schema?.types ?? []
  console.log(`Total: ${types.length}\n`)

  // Step 2: Pegar campos de ProductOfferConnectionV2 e relacionados
  const targetTypes = types
    .filter((t: any) => t.kind === 'OBJECT')
    .filter((t: any) =>
      t.name.includes('Offer') || t.name.includes('Product') ||
      t.name.includes('Campaign') || t.name.includes('Banner') ||
      t.name.includes('Conversion') || t.name.includes('ItemFeed')
    )
    .map((t: any) => t.name)

  console.log('Tipos relevantes:', targetTypes.join(', '))
  console.log('')

  // Step 3: Para cada tipo relevante, buscar campos (query separada)
  for (const typeName of targetTypes) {
    // Usa a feature de __type (singular)
    const r = await gql(`{
      __type(name: "${typeName}") {
        name kind
        fields { name type { name kind ofType { name kind ofType { name kind } } } }
      }
    }`)

    const t = r?.data?.__type
    if (!t?.fields?.length) continue

    console.log(`📦 ${t.name} (${t.fields.length} campos)`)
    for (const f of t.fields) {
      // Resolve o nome do tipo navegando ofType
      let cur = f.type
      let tn = ''
      while (cur) {
        if (cur.name && cur.name !== 'NonNull' && cur.name !== 'List') { tn = cur.name; break }
        cur = cur.ofType
      }
      if (!tn) tn = '?'
      console.log(`   ${f.name}: ${tn}`)
    }
    console.log('')
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })

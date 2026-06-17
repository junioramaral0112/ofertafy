/**
 * 🔍 Introspecção completa do schema GraphQL da Shopee Afiliados
 *
 * Uso: npx tsx src/scripts/introspect-shopee.ts
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

// Auth: plain SHA256 hash
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
  console.log('🔍 INTROSPECÇÃO COMPLETA SHOPEE AFILIADOS\n')

  // 1. Listar todos os types do schema
  console.log('── Todos os tipos ──')
  const schema = await gql(`query {
    __schema {
      queryType {
        fields {
          name
          description
          args { name description type { name kind ofType { name kind } } }
          type { name kind ofType { name kind } }
        }
      }
      mutationType { name fields { name } }
    }
  }`)
  const fields = schema?.data?.__schema?.queryType?.fields ?? []
  console.log(`Queries disponíveis: ${fields.length}\n`)
  for (const f of fields) {
    console.log(`  📌 ${f.name}`)
    if (f.description) console.log(`     desc: ${f.description}`)
    if (f.args?.length) {
      for (const a of f.args) {
        const typeName = a.type?.ofType?.name ?? a.type?.name ?? '?'
        console.log(`     arg: ${a.name}: ${typeName}${a.description ? ' — ' + a.description : ''}`)
      }
    }
    const retType = f.type?.ofType?.name ?? f.type?.name ?? '?'
    console.log(`     retorna: ${retType}`)
    console.log('')
  }

  // 2. Introspectar tipos de entrada (inputs) para descobrir os argumentos corretos
  console.log('── Input Types ──')
  const inputs = await gql(`query {
    __schema {
      types {
        name kind
        ... on InputObjectType {
          inputFields { name description type { name kind ofType { name kind } } }
        }
      }
    }
  }`)
  const types = inputs?.data?.__schema?.types ?? []
  for (const t of types) {
    if (t.kind === 'INPUT_OBJECT' && t.inputFields?.length) {
      console.log(`  📥 ${t.name}`)
      for (const f of t.inputFields) {
        const tn = f.type?.ofType?.name ?? f.type?.name ?? '?'
        console.log(`     ${f.name}: ${tn}${f.description ? ' — ' + f.description : ''}`)
      }
    }
  }

  // 3. Detalhes dos tipos de retorno principais
  console.log('\n── Tipos de retorno (objetos principais) ──')
  const objs = await gql(`query {
    __schema {
      types {
        name kind
        ... on ObjectType {
          fields { name description type { name kind ofType { name kind ofType { name kind } } } }
        }
      }
    }
  }`)
  const objTypes = objs?.data?.__schema?.types ?? []
  const keyTypes = ['ProductOffer', 'Offer', 'OfferItem', 'OfferConnection', 'OfferNode',
                    'Campaign', 'ShopOffer', 'BrandOffer', 'Banner', 'ConversionReport',
                    'ShortLink', 'ItemFeed']

  for (const t of objTypes) {
    if (t.kind === 'OBJECT' && keyTypes.some(k => t.name?.includes(k) || k.includes(t.name))) {
      console.log(`  📦 ${t.name} (${t.fields?.length ?? 0} campos)`)
      if (t.fields) {
        for (const f of t.fields.slice(0, 15)) {
          let tn = f.type?.name ?? ''
          if (!tn) tn = f.type?.ofType?.ofType?.name ?? f.type?.ofType?.name ?? '?'
          console.log(`     ${f.name}: ${tn}`)
        }
        if (t.fields.length > 15) console.log(`     ... +${t.fields.length - 15} campos`)
      }
      console.log('')
    }
  }

  console.log('✅ Introspecção concluída')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })

import cron from 'node-cron'
import { fetchAllDeals } from './fetch-all-deals'
import { dispatchDailyOffers } from '@/services/groupNotifier'

let cronStarted = false

export function startCronJobs() {
  if (cronStarted) return
  cronStarted = true

  console.log('⏰ Cron jobs iniciados')
  console.log('   📊 Scraping: a cada 60 minutos')
  console.log('   📢 Disparo de ofertas: 10h, 14h, 18h')

  // ── Scraping: executa agora + a cada 60 minutos ──────────
  runFetch()

  cron.schedule('0 * * * *', () => {
    console.log('⏰ Cron: scraping automático...')
    runFetch()
  })

  // ── Disparo de ofertas: 10h, 14h, 18h (horário de Brasília) ──
  // node-cron usa o timezone do sistema. No VPS, configure:
  //   timedatectl set-timezone America/Sao_Paulo
  cron.schedule('0 10 * * *', () => {
    console.log('📢 Cron: disparo das 10h...')
    runDispatch()
  })

  cron.schedule('0 14 * * *', () => {
    console.log('📢 Cron: disparo das 14h...')
    runDispatch()
  })

  cron.schedule('0 18 * * *', () => {
    console.log('📢 Cron: disparo das 18h...')
    runDispatch()
  })
}

async function runFetch() {
  try {
    console.log('🔍 Buscando ofertas automaticamente...')
    const results = await fetchAllDeals()
    const total = results.reduce((s, r) => s + r.offersAdded + r.offersUpdated, 0)
    console.log(`✅ Scraping automático concluído: ${total} ofertas processadas`)
  } catch (e) {
    console.error('Erro no scraping automático:', e)
  }
}

async function runDispatch() {
  try {
    const result = await dispatchDailyOffers()
    if (result.success) {
      console.log(`✅ Disparo concluído: ${result.offers.length} ofertas enviadas`)
    } else {
      console.log(`⚠️  Disparo: ${result.message}`)
    }
  } catch (e) {
    console.error('Erro no disparo automático:', e)
  }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const campaigns = [
  // SHOPEE
  { slug: 'shopee-7-7', name: 'Shopee 7.7', store: 'shopee', description: 'Super ofertas de meio de ano da Shopee', startDate: new Date('2026-07-01'), endDate: new Date('2026-07-07'), color: '#EE4D2D' },
  { slug: 'shopee-11-11', name: 'Shopee 11.11', store: 'shopee', description: 'Maior evento de ofertas da Shopee', startDate: new Date('2026-11-01'), endDate: new Date('2026-11-11'), color: '#EE4D2D' },
  { slug: 'shopee-12-12', name: 'Shopee 12.12', store: 'shopee', description: 'Últimas grandes ofertas do ano', startDate: new Date('2026-12-01'), endDate: new Date('2026-12-12'), color: '#EE4D2D' },

  // MERCADO LIVRE
  { slug: 'mercado-livre-festival-ofertas', name: 'Festival de Ofertas ML', store: 'mercadolivre', description: 'Festival de ofertas do Mercado Livre', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-22'), color: '#FFE600' },
  { slug: 'mercado-livre-meli-days', name: 'Meli Days', store: 'mercadolivre', description: 'Dias de descontos exclusivos', startDate: new Date('2026-08-20'), endDate: new Date('2026-08-27'), color: '#FFE600' },

  // AMAZON
  { slug: 'prime-day', name: 'Prime Day 2026', store: 'amazon', description: 'Ofertas exclusivas para membros Prime', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-17'), color: '#FF9900' },
  { slug: 'black-friday', name: 'Black Friday 2026', store: 'amazon', description: 'A maior temporada de descontos do ano', startDate: new Date('2026-11-25'), endDate: new Date('2026-11-28'), color: '#000000' },
  { slug: 'cyber-monday', name: 'Cyber Monday 2026', store: 'amazon', description: 'Descontos em tecnologia e eletrônicos', startDate: new Date('2026-11-29'), endDate: new Date('2026-12-01'), color: '#3b82f6' },

  // MAGALU
  { slug: 'magalu-day', name: 'Magalu Day', store: 'magalu', description: 'Dia de ofertas especiais do Magalu', startDate: new Date('2026-08-15'), endDate: new Date('2026-08-16'), color: '#0086FF' },
]

async function main() {
  console.log('🌱 Semeando campanhas...')

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    })
    console.log(`  ✅ ${c.name}`)
  }

  console.log(`\n🎉 ${campaigns.length} campanhas cadastradas!`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })

import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Calendário de Promoções 2026 — Ofertafy',
  description: 'Confira o calendário completo de promoções: Shopee 7.7, Prime Day, Black Friday, Meli Days e muito mais.',
  alternates: { canonical: '/promocoes' },
}

const STORE_ICONS: Record<string, string> = {
  shopee: '🔴',
  mercadolivre: '🟡',
  amazon: '🟠',
  magalu: '🔵',
}

const STORE_NAMES: Record<string, string> = {
  shopee: 'Shopee',
  mercadolivre: 'Mercado Livre',
  amazon: 'Amazon',
  magalu: 'Magalu',
}

export default async function PromocoesPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { startDate: 'asc' },
  })

  const now = new Date()
  const active = campaigns.filter((c) => c.startDate <= now && c.endDate >= now)
  const upcoming = campaigns.filter((c) => c.startDate > now)
  const past = campaigns.filter((c) => c.endDate < now).slice(0, 4)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
        🗓 Calendário de Promoções 2026
      </h1>
      <p className="text-slate-500 mb-10">Datas confirmadas das maiores campanhas de desconto do ano.</p>

      {/* Ativas agora */}
      {active.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-green-600 mb-4">🔥 Acontecendo Agora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((c) => <CampaignCard key={c.id} campaign={c} active />)}
          </div>
        </section>
      )}

      {/* Próximas */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-slate-900 mb-4">📅 Próximas Campanhas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((c) => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      </section>

      {/* Encerradas */}
      <section>
        <h2 className="text-lg font-bold text-slate-400 mb-4">✅ Encerradas Recentemente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {past.map((c) => <CampaignCard key={c.id} campaign={c} past />)}
        </div>
      </section>
    </div>
  )
}

function CampaignCard({ campaign, active, past }: { campaign: any; active?: boolean; past?: boolean }) {
  const icon = STORE_ICONS[campaign.store] || '🏪'
  const storeName = STORE_NAMES[campaign.store] || campaign.store
  const now = new Date()
  const endDate = new Date(campaign.endDate)
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24))

  return (
    <Link
      href={`/promocoes/${campaign.slug}`}
      className={`block rounded-2xl border p-5 transition-all hover:shadow-lg hover:scale-[1.02] ${
        active ? 'border-green-300 bg-green-50/50'
        : past ? 'border-slate-200 bg-slate-50/50 opacity-60'
        : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">
          {icon} {storeName}
        </span>
        {active && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">AO VIVO</span>}
        {active && diffDays <= 3 && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
            ⏳ {diffDays}d restantes
          </span>
        )}
      </div>

      <h3 className="font-bold text-lg text-slate-900 mb-1">{campaign.name}</h3>
      <p className="text-sm text-slate-500 mb-3">{campaign.description}</p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{new Date(campaign.startDate).toLocaleDateString('pt-BR')}</span>
        <span>→</span>
        <span>{new Date(campaign.endDate).toLocaleDateString('pt-BR')}</span>
      </div>
    </Link>
  )
}

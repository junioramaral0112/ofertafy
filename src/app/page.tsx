import type { Metadata } from 'next'
import { getHomeOffers, getStats } from '@/lib/fetcher'
import OfferGrid from '@/components/OfferGrid'
import FlashBanner from '@/components/FlashBanner'
import TopOffers from '@/components/TopOffers'
import SearchBar from '@/components/SearchBar'
import NewsletterForm from '@/components/NewsletterForm'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'As Melhores Ofertas em um Só Lugar — Compare Preços e Economize',
  description:
    'Encontre as melhores promoções do Mercado Livre, Magalu, Shopee e Amazon. Ofertas atualizadas a cada hora com links de afiliado. Cupons de desconto exclusivos!',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Ofertafy — Compare Preços e Economize',
    description:
      'Milhares de ofertas do Mercado Livre, Magalu, Shopee e Amazon em um só lugar. Preços atualizados a cada hora.',
    url: '/',
  },
}

export default async function HomePage() {
  const data = await getHomeOffers().catch(() => ({ flashDeals: [] as any[], topOffers: [] as any[], recentOffers: [] as any[] }))
  const stats = await getStats().catch(() => ({ totalOffers: 0, totalClicks: 0, stores: [] as { store: string; count: number }[] }))

  return (
    <div>
      {/* Hero — compacto, mobile-first */}
      <section className="gradient-primary text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1.5 leading-tight">
            As melhores ofertas em <span className="text-accent">um só lugar</span> 🏷️
          </h1>
          <p className="text-sm md:text-base text-white/70 mb-4 max-w-xl mx-auto">
            Mercado Livre, Magalu, Amazon e Shopee — menores preços, maior economia.
          </p>
          <div className="max-w-lg mx-auto mb-5"><SearchBar large placeholder="O que você quer economizar hoje?" /></div>
          <div className="flex justify-center gap-6 md:gap-10 text-center">
            <div><p className="text-xl md:text-2xl font-extrabold">{stats.totalOffers.toLocaleString()}</p><p className="text-[10px] md:text-xs text-white/60">Ofertas ativas</p></div>
            <div><p className="text-xl md:text-2xl font-extrabold">{stats.totalClicks.toLocaleString()}</p><p className="text-[10px] md:text-xs text-white/60">Economias</p></div>
            <div><p className="text-xl md:text-2xl font-extrabold">4</p><p className="text-[10px] md:text-xs text-white/60">Lojas</p></div>
          </div>
        </div>
      </section>

      {/* ⚡ Oferta Relâmpago — FlashBanner */}
      <FlashBanner offers={data.recentOffers || data.topOffers || data.flashDeals || []} />

      {/* Categories — compacto, acima dos produtos */}
      <section className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/categoria/${cat.slug}`}
              className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent — grid principal, sem título para economizar espaço */}
      {data.recentOffers && data.recentOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-900">🆕 Ofertas do dia</h2>
            <span className="text-xs text-slate-400">{data.recentOffers.length} promoções</span>
          </div>
          <OfferGrid offers={data.recentOffers} />
        </section>
      )}

      {/* Top Week */}
      {data.topOffers && data.topOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10"><TopOffers offers={data.topOffers} /></section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="gradient-primary rounded-3xl p-8 md:p-10 text-center text-white">
          <h2 className="text-xl md:text-2xl font-extrabold mb-2">Não perca nenhuma oferta! 🔔</h2>
          <p className="text-sm text-white/70 mb-5 max-w-md mx-auto">Receba as melhores promoções direto no seu WhatsApp ou e-mail.</p>

          <div className="mb-5">
            <p className="text-xs text-white/60 mb-2">📧 Receba as melhores ofertas do dia no seu e-mail</p>
            <NewsletterForm />
          </div>

          <div className="pt-5 border-t border-white/20">
            <p className="text-xs text-white/60 mb-2">📱 Ou entre no nosso grupo de ofertas</p>
            <a
              href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors text-sm"
            >
              📱 Entrar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

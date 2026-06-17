import { getHomeOffers, getStats } from '@/lib/fetcher'
import OfferGrid from '@/components/OfferGrid'
import FlashBanner from '@/components/FlashBanner'
import FlashDeals from '@/components/FlashDeals'
import TopOffers from '@/components/TopOffers'
import SearchBar from '@/components/SearchBar'
import NewsletterForm from '@/components/NewsletterForm'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await getHomeOffers().catch(() => ({ flashDeals: [] as any[], topOffers: [] as any[], recentOffers: [] as any[] }))
  const stats = await getStats().catch(() => ({ totalOffers: 0, totalClicks: 0, stores: [] as { store: string; count: number }[] }))

  return (
    <div>
      {/* Hero */}
      <section className="gradient-primary text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            As melhores ofertas em<br /><span className="text-accent">um só lugar</span> 🏷️
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Comparamos Mercado Livre, Magalu, Amazon e Shopee para você encontrar os menores preços e economizar de verdade.
          </p>
          <div className="max-w-xl mx-auto"><SearchBar large placeholder="O que você quer economizar hoje?" /></div>
          <div className="flex justify-center gap-6 md:gap-12 mt-10 text-center">
            <div><p className="text-2xl md:text-3xl font-extrabold">{stats.totalOffers.toLocaleString()}</p><p className="text-xs md:text-sm text-white/70">Ofertas ativas</p></div>
            <div><p className="text-2xl md:text-3xl font-extrabold">{stats.totalClicks.toLocaleString()}</p><p className="text-xs md:text-sm text-white/70">Economias geradas</p></div>
            <div><p className="text-2xl md:text-3xl font-extrabold">4</p><p className="text-xs md:text-sm text-white/70">Lojas integradas</p></div>
          </div>
        </div>
      </section>

      {/* ⚡ Oferta Relâmpago — FlashBanner */}
      <FlashBanner offers={data.recentOffers || data.topOffers || data.flashDeals || []} />

      {/* Old Flash Deals carrossel (mantido como secundário) */}
      {data.flashDeals && data.flashDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">⚡ Mais ofertas relâmpago</h2>
          <FlashDeals offers={data.flashDeals} />
        </section>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-4">📂 Categorias populares</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/categoria/${cat.slug}`}
              className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all card-hover">
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Top Week */}
      {data.topOffers && data.topOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-12"><TopOffers offers={data.topOffers} /></section>
      )}

      {/* Recent */}
      {data.recentOffers && data.recentOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-slate-900">🆕 Ofertas Recentes</h2>
            <p className="text-sm text-slate-500">Últimas promoções encontradas</p>
          </div>
          <OfferGrid offers={data.recentOffers} />
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="gradient-primary rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Não perca nenhuma oferta! 🔔</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">Receba as melhores promoções direto no seu WhatsApp ou e-mail.</p>

          {/* Newsletter */}
          <div className="mb-6">
            <p className="text-sm text-white/70 mb-3">📧 Receba as melhores ofertas do dia no seu e-mail</p>
            <NewsletterForm />
          </div>

          {/* WhatsApp */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-sm text-white/70 mb-3">📱 Ou entre no nosso grupo de ofertas</p>
            <a
              href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
            >
              📱 Entrar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sobre Nós — Ofertafy',
  description: 'Conheça o Ofertafy, o agregador inteligente de ofertas que compara preços do Mercado Livre, Magalu, Shopee e Amazon para você economizar.',
  alternates: { canonical: '/sobre-nos' },
  openGraph: { title: 'Sobre o Ofertafy', description: 'O melhor agregador de ofertas do Brasil.', url: '/sobre-nos' },
}

export default function SobreNosPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="gradient-primary text-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Sobre o Ofertafy 🏷️</h1>
          <p className="text-lg text-white/80">O agregador inteligente de ofertas do Brasil</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <div className="prose prose-slate max-w-none space-y-6">
          <h2 className="text-xl font-bold text-slate-900">O que é o Ofertafy?</h2>
          <p className="text-slate-600 leading-relaxed">
            O <strong>Ofertafy</strong> é um agregador inteligente de ofertas que vasculha automaticamente
            as principais lojas do Brasil — <strong>Mercado Livre</strong>, <strong>Magalu</strong>,{' '}
            <strong>Shopee</strong> e <strong>Amazon</strong> — para encontrar os melhores preços
            e promoções em um só lugar.
          </p>

          <h2 className="text-xl font-bold text-slate-900">Como funciona?</h2>
          <p className="text-slate-600 leading-relaxed">
            Nossos robôs buscam produtos a cada hora, analisam preços, calculam descontos reais
            e organizam tudo para você comparar e economizar. Quando você clica em uma oferta
            e compra, a loja parceira nos paga uma pequena comissão — você <strong>não paga nada a mais</strong> por isso.
          </p>

          <h2 className="text-xl font-bold text-slate-900">Por que usar o Ofertafy?</h2>
          <ul className="text-slate-600 leading-relaxed space-y-2">
            <li>✅ <strong>Preços atualizados a cada hora</strong> — as promoções são verificadas constantemente</li>
            <li>✅ <strong>4 lojas em um só lugar</strong> — compare ML, Magalu, Shopee e Amazon sem abrir 4 abas</li>
            <li>✅ <strong>Histórico de preços</strong> — veja se o desconto é real ou maquiado</li>
            <li>✅ <strong>Cupons de desconto</strong> — códigos atualizados para economizar ainda mais</li>
            <li>✅ <strong>100% gratuito</strong> — você não paga nada para usar</li>
          </ul>

          <div className="bg-slate-50 rounded-2xl p-6 mt-8 text-center">
            <p className="text-slate-700 font-medium mb-3">
              Tem alguma dúvida, sugestão ou quer anunciar conosco?
            </p>
            <Link href="/contato" className="gradient-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90">
              Entre em contato →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

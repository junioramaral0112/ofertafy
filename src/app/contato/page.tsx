import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contato — Ofertafy',
  description: 'Entre em contato com o Ofertafy. Dúvidas, sugestões ou parcerias.',
  alternates: { canonical: '/contato' },
  openGraph: { title: 'Contato | Ofertafy', description: 'Fale com a gente!', url: '/contato' },
}

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="gradient-primary text-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Fale com a gente 📬</h1>
          <p className="text-lg text-white/80">Dúvidas, sugestões ou parcerias — estamos aqui!</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-10 md:py-14 space-y-8">
        {/* Email */}
        <div className="bg-slate-50 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-4xl mb-3">📧</p>
          <h2 className="text-lg font-bold text-slate-900 mb-2">E-mail oficial</h2>
          <a
            href="mailto:ofertafy.br@gmail.com.br"
            className="text-primary font-semibold text-lg hover:underline"
          >
            ofertafy.br@gmail.com.br
          </a>
          <p className="text-sm text-slate-500 mt-2">
            Respondemos em até 24 horas úteis
          </p>
        </div>

        {/* WhatsApp */}
        <div className="bg-green-50 rounded-2xl p-6 md:p-8 text-center border-2 border-green-200">
          <p className="text-4xl mb-3">💬</p>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            Grupo de Ofertas no WhatsApp
          </h2>
          <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
            Entre no nosso grupo e receba as melhores ofertas em primeira mão,
            direto no seu celular!
          </p>
          <a
            href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors text-base shadow-lg shadow-green-500/25"
          >
            📱 Entrar no Grupo do WhatsApp
          </a>
        </div>

        {/* Voltar */}
        <div className="text-center">
          <Link
            href="/"
            className="text-slate-500 hover:text-primary text-sm font-medium transition-colors"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </section>
    </div>
  )
}

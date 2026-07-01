import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Ofertafy',
  description: 'Política de privacidade do Ofertafy.',
}

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-extrabold mb-8">Política de Privacidade</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p>Coletamos apenas dados anônimos de navegação via Google Analytics. Não armazenamos dados pessoais de visitantes.</p>
        <p>Utilizamos cookies essenciais para o funcionamento do site e cookies de análise (Google Analytics).</p>
        <p>Não compartilhamos dados com terceiros, exceto quando necessário para o funcionamento do site (hospedagem, analytics).</p>
        <p>Para questões sobre privacidade: privacidade@ofertafy.com.br</p>
      </div>
    </div>
  )
}

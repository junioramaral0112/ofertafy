import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — Ofertafy',
  description: 'Termos de uso do Ofertafy.',
}

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-extrabold mb-8">Termos de Uso</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p>Ao usar o Ofertafy, você concorda com estes termos. Somos um site afiliado — podemos receber comissão por compras realizadas através dos nossos links. Você não paga nada a mais por isso.</p>
        <p>Não nos responsabilizamos por alterações de preço ou disponibilidade dos produtos exibidos. As ofertas são atualizadas periodicamente.</p>
        <p>Para dúvidas, entre em contato pelo email: contato@ofertafy.com.br</p>
      </div>
    </div>
  )
}

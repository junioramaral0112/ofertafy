import Link from 'next/link'

export const dynamic = 'force-static'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <span className="text-7xl mb-6">🔍</span>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Pagina nao encontrada</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        A pagina que voce esta procurando nao existe ou foi removida.
        Que tal aproveitar e buscar uma oferta?
      </p>
      <div className="flex gap-3">
        <Link href="/" className="gradient-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          Voltar ao inicio
        </Link>
        <Link href="/busca?q=" className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:border-primary transition-colors">
          Ver ofertas
        </Link>
      </div>
    </div>
  )
}

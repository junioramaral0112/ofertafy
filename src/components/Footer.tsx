import Link from 'next/link'
import { CATEGORIES, STORES } from '@/lib/utils'

export default function Footer() {
  const activeStores = STORES.filter(s => s.active)

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🏷️</span>
              <span className="text-2xl font-extrabold text-white">oferta<span className="text-accent">Fy</span></span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              As melhores ofertas do Mercado Livre, Magalu, Amazon e Shopee em um só lugar. Compare preços e economize!
            </p>
            <div className="flex gap-3 text-xs">
              <a href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">📱 WhatsApp</a>
              <a href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">📧 Newsletter</a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Lojas</h3>
            <ul className="space-y-2.5">
              {activeStores.map((s) => (
                <li key={s.slug}><Link href={`/loja/${s.slug}`} className="text-sm text-slate-400 hover:text-white transition-colors">Ofertas na {s.name}</Link></li>
              ))}
              <li><Link href="/busca?q=" className="text-sm text-slate-400 hover:text-white transition-colors">Todas as lojas</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Categorias</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}><Link href={`/categoria/${cat.slug}`} className="text-sm text-slate-400 hover:text-white transition-colors">{cat.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">ofertaFy</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Início</Link></li>
              <li><Link href="/busca?q=" className="text-sm text-slate-400 hover:text-white transition-colors">Buscar ofertas</Link></li>
              <li><Link href="/sobre-nos" className="text-sm text-slate-400 hover:text-white transition-colors">Sobre nós</Link></li>
              <li><Link href="/contato" className="text-sm text-slate-400 hover:text-white transition-colors">Contato</Link></li>
              <li><Link href="/cupons" className="text-sm text-slate-400 hover:text-white transition-colors">Cupons</Link></li>
              <li><Link href="/termos-de-uso" className="text-sm text-slate-400 hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link href="/politica-de-privacidade" className="text-sm text-slate-400 hover:text-white transition-colors">Privacidade</Link></li>
            </ul>
            <div className="mt-6 bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
              ⚠️ Somos um site afiliado. Podemos receber comissão por compras realizadas através dos nossos links. Mercado Livre (matt_tool), Magalu (Magazine Você) e Amazon (tag ofertafy00-20).
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ofertaFy — Links de afiliado Mercado Livre, Magalu e Amazon.
        </div>
      </div>
    </footer>
  )
}

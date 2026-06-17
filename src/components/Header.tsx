'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { CATEGORIES, STORES } from '@/lib/utils'

export default function Header() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/busca?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const activeStores = STORES.filter(s => s.active)
  const dormantStores = STORES.filter(s => !s.active)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="gradient-primary text-white text-xs py-1.5 px-4 text-center">
        🔥 As melhores ofertas do Mercado Livre, Magalu, Amazon e Shopee em um só lugar!
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="shrink-0">
            <img
              src="/logo-pintinho.png"
              alt="ofertafy"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ofertas em todas as lojas..."
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm bg-slate-50 focus:bg-white transition-colors" />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 gradient-primary text-white p-2 rounded-lg hover:opacity-90">
                <SearchIcon />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-xs">
              {activeStores.map((s) => (
                <Link key={s.slug} href={`/loja/${s.slug}`}
                  className="px-2.5 py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors font-medium text-slate-600">
                  {s.name}
                </Link>
              ))}
              {dormantStores.length > 0 && <span className="text-slate-300 mx-1">|</span>}
              {dormantStores.map((s) => (
                <span key={s.slug} title="Em breve"
                  className="px-2.5 py-1 rounded-full border border-dashed border-slate-200 text-slate-400 font-medium text-[10px] cursor-not-allowed">
                  {s.name} 🔜
                </span>
              ))}
            </div>
            {/* Cupons link */}
            <Link href="/cupons" title="Cupons de desconto"
              className="text-xs text-slate-500 hover:text-primary font-medium hidden md:flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
              🎫 Cupons
            </Link>
            {/* Admin link */}
            <Link href="/admin" title="Gerenciar ofertas"
              className="text-xs text-slate-400 hover:text-primary font-medium hidden md:block px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
              ⚙️ Admin
            </Link>

            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
              <MenuIcon open={mobileMenu} />
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          <div ref={catRef} className="relative">
            <button onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
              <GridIcon /> Categorias <ChevronIcon open={categoriesOpen} />
            </button>
            {categoriesOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-2 animate-fade-in">
                {CATEGORIES.map((cat) => (
                  <Link key={cat.slug} href={`/categoria/${cat.slug}`} onClick={() => setCategoriesOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">{cat.name}</Link>
                ))}
              </div>
            )}
          </div>
          {CATEGORIES.slice(0, 7).map((cat) => (
            <Link key={cat.slug} href={`/categoria/${cat.slug}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap transition-colors">{cat.name}</Link>
          ))}
          <Link href="/busca?q=" className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 whitespace-nowrap">Ver todas →</Link>
        </nav>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-fade-in">
          <div className="p-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ofertas..." className="w-full pl-4 pr-12 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm" />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 gradient-primary text-white p-2 rounded-lg"><SearchIcon /></button>
              </div>
            </form>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Lojas</p>
              {activeStores.map((s) => (
                <Link key={s.slug} href={`/loja/${s.slug}`} onClick={() => setMobileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">{s.name}</Link>
              ))}
              <Link href="/cupons" onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50 font-medium">🎫 Cupons de Desconto</Link>
              <Link href="/admin" onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50 text-primary font-medium">⚙️ Gerenciar Ofertas</Link>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2 mt-4">Categorias</p>
              {CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/categoria/${cat.slug}`} onClick={() => setMobileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">{cat.name}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function SearchIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg> }
function MenuIcon({ open }: { open: boolean }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{open ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}</svg> }
function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> }
function ChevronIcon({ open }: { open: boolean }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg> }

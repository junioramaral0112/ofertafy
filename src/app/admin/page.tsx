'use client'

import { useState, useEffect, useRef } from 'react'
import { formatPrice } from '@/lib/utils'

interface Offer {
  id: string
  title: string
  price: number
  originalPrice: number
  discountPct: number
  store: string
  storeLabel: string
  category: string
  categorySlug: string
  imageUrl: string
  url: string
  description: string | null
  installment: string | null
  freeShipping: boolean
  isFlash: boolean
  flashEndsAt: string | null
  sourceId: string | null
  clicks: number
  createdAt: string
}

const STORE_OPTIONS = [
  { value: 'mercadolivre', label: 'Mercado Livre' },
  { value: 'magalu', label: 'Magalu' },
  { value: 'shopee', label: 'Shopee (adormecida)' },
  { value: 'amazon', label: 'Amazon (adormecida)' },
]

const CATEGORY_OPTIONS = [
  'eletronicos', 'celulares', 'informatica', 'moda', 'casa',
  'eletrodomesticos', 'esportes', 'beleza', 'brinquedos', 'pets', 'livros', 'automotivo',
]

const emptyForm = {
  title: '',
  price: 0,
  originalPrice: 0,
  discountPct: 0,
  store: 'mercadolivre',
  storeLabel: 'Mercado Livre',
  category: 'Eletrônicos',
  categorySlug: 'eletronicos',
  imageUrl: 'https://picsum.photos/seed/produto/400/400',
  url: '',
  description: '',
  installment: '',
  freeShipping: true,
  isFlash: false,
  flashEndsAt: '',
  sourceId: '',
}

export default function AdminPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [scraping, setScraping] = useState(false)
  const [marketingOffer, setMarketingOffer] = useState<Offer | null>(null)

  useEffect(() => { loadOffers() }, [])

  async function triggerScraping() {
    setScraping(true)
    setAlert(null)
    try {
      const res = await fetch('/api/fetch?secret=ofertafy-secret-2024')
      const data = await res.json()
      if (data.success) {
        const r = data.results
        let msg = `Scraping concluido! `
        if (r) msg += r.map((x: any) => `${x.store}: ${x.offersAdded} novas, ${x.offersUpdated} atualizadas`).join(' | ')
        setAlert({ type: 'success', msg })
        loadOffers()
      } else {
        setAlert({ type: 'error', msg: data.error || 'Erro no scraping' })
      }
    } catch (e: any) {
      setAlert({ type: 'error', msg: 'Erro: ' + e.message })
    }
    setScraping(false)
  }

  async function loadOffers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/offers')
      const data = await res.json()
      setOffers(data.offers || [])
    } catch {
      setError('Erro ao carregar ofertas')
    }
    setLoading(false)
  }

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(offer: Offer) {
    setEditingId(offer.id)
    setForm({
      title: offer.title,
      price: offer.price,
      originalPrice: offer.originalPrice,
      discountPct: offer.discountPct,
      store: offer.store,
      storeLabel: offer.storeLabel,
      category: offer.category,
      categorySlug: offer.categorySlug,
      imageUrl: offer.imageUrl,
      url: offer.url,
      description: offer.description || '',
      installment: offer.installment || '',
      freeShipping: offer.freeShipping,
      isFlash: offer.isFlash,
      flashEndsAt: offer.flashEndsAt || '',
      sourceId: offer.sourceId || '',
    })
    setShowForm(true)
  }

  function calculateDiscount() {
    if (form.originalPrice > 0 && form.price > 0) {
      const pct = Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
      setForm({ ...form, discountPct: pct })
    }
  }

  function handleStoreChange(store: string) {
    const label = STORE_OPTIONS.find(s => s.value === store)?.label || store
    // Auto-generate URL with affiliate tracking
    let url = form.url
    if (store === 'mercadolivre' && !url.includes('matt_tool=35888960')) {
      url = url ? `${url}?matt_tool=35888960` : 'https://www.mercadolivre.com.br/?matt_tool=35888960'
    }
    if (store === 'magalu' && !url.includes('magazinevoce.com.br')) {
      url = url || 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/'
    }
    setForm({ ...form, store, storeLabel: label, url })
  }

  function handleCategoryChange(slug: string) {
    const name = slug.charAt(0).toUpperCase() + slug.slice(1)
    setForm({ ...form, category: name, categorySlug: slug })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setAlert(null)

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { ...form, id: editingId } : form

      const res = await fetch('/api/admin/offers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }

      setAlert({ type: 'success', msg: editingId ? 'Oferta atualizada!' : 'Oferta criada!' })
      setShowForm(false)
      loadOffers()
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message })
    }
    setSaving(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Deletar "${title.slice(0, 60)}"?`)) return

    try {
      const res = await fetch(`/api/admin/offers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
      setAlert({ type: 'success', msg: 'Oferta removida!' })
      loadOffers()
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message })
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">📦 Gerenciar Ofertas</h1>
          <p className="text-sm text-slate-500 mt-1">{offers.length} ofertas no banco</p>
        </div>
        <div className="flex gap-3">
          <button onClick={triggerScraping} disabled={scraping}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {scraping ? '⏳ Buscando...' : '🔍 Buscar Ofertas Agora'}
          </button>
          <button onClick={openNew}
            className="gradient-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
            ➕ Nova Oferta
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {alert.msg}
          <button onClick={() => setAlert(null)} className="float-right font-bold">✕</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <span className="text-5xl block mb-4">📭</span>
          <p className="text-slate-500 text-lg mb-2">Nenhuma oferta cadastrada</p>
          <p className="text-slate-400 text-sm mb-6">Clique em "Nova Oferta" para adicionar a primeira</p>
          <button onClick={openNew}
            className="gradient-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90">
            ➕ Criar Primeira Oferta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Produto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Loja</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Preço</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Desc%</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={offer.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <span className="font-medium text-slate-800 line-clamp-1 max-w-[300px]">{offer.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${offer.store === 'mercadolivre' ? 'bg-[#FFE600] text-slate-900' : offer.store === 'magalu' ? 'bg-[#0086FF] text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {offer.storeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatPrice(offer.price)}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 font-bold">-{offer.discountPct}%</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{offer.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setMarketingOffer(offer)}
                          className="px-2 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                          📢 Marketing
                        </button>
                        <button onClick={() => openEdit(offer)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                          ✏️ Editar
                        </button>
                        <button onClick={() => handleDelete(offer.id, offer.title)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Marketing */}
      {marketingOffer && <MarketingModal offer={marketingOffer} onClose={() => setMarketingOffer(null)} />}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? '✏️ Editar Oferta' : '➕ Nova Oferta'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Título do Produto *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                  placeholder="Ex: Smart TV 50 4K UHD Samsung" />
              </div>

              {/* Loja + Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Loja *</label>
                  <select value={form.store} onChange={e => handleStoreChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none">
                    {STORE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria *</label>
                  <select value={form.categorySlug} onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none">
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Preços */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Atual *</label>
                  <input required type="number" step="0.01" value={form.price}
                    onChange={e => { setForm({ ...form, price: parseFloat(e.target.value) || 0 }); setTimeout(calculateDiscount, 100) }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço Original *</label>
                  <input required type="number" step="0.01" value={form.originalPrice}
                    onChange={e => { setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 }); setTimeout(calculateDiscount, 100) }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Desconto %</label>
                  <input type="number" value={form.discountPct} readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-green-600 font-bold" />
                </div>
              </div>

              {/* URL + Imagem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Link do Afiliado *</label>
                  <input required value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-primary focus:outline-none"
                    placeholder="https://www.mercadolivre.com.br/...?matt_tool=35888960" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">URL da Imagem</label>
                  <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-primary focus:outline-none" />
                </div>
              </div>

              {/* Source ID + Parcelamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ID na Plataforma</label>
                  <input value={form.sourceId} onChange={e => setForm({ ...form, sourceId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                    placeholder="Ex: MLB123456" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Parcelamento</label>
                  <input value={form.installment} onChange={e => setForm({ ...form, installment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                    placeholder="Ex: 12x R$ 158,25 sem juros" />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                  placeholder="Descrição curta do produto..." />
              </div>

              {/* Flags */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.freeShipping} onChange={e => setForm({ ...form, freeShipping: e.target.checked })}
                    className="rounded" />
                  <span className="text-sm text-slate-700">📦 Frete Grátis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFlash} onChange={e => setForm({ ...form, isFlash: e.target.checked })}
                    className="rounded" />
                  <span className="text-sm text-slate-700">⚡ Oferta Relâmpago</span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Salvando...' : editingId ? '💾 Atualizar Oferta' : '➕ Criar Oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Cores por loja ──────────────────────────────────────
const STORE_THEME: Record<string, { bg: string; text: string; badge: string; logo: string }> = {
  mercadolivre: { bg: '#FFE600', text: '#333', badge: 'bg-[#FFE600] text-slate-900', logo: 'Mercado Livre' },
  magalu:        { bg: '#0086FF', text: '#fff', badge: 'bg-[#0086FF] text-white',   logo: 'Magalu' },
  shopee:        { bg: '#EE4D2D', text: '#fff', badge: 'bg-[#EE4D2D] text-white',   logo: 'Shopee' },
  amazon:        { bg: '#FF9900', text: '#111', badge: 'bg-[#FF9900] text-slate-900', logo: 'Amazon' },
  tiktok:        { bg: '#000000', text: '#fff', badge: 'bg-black text-white',       logo: 'TikTok Shop' },
}

// ── Componente Marketing Modal ──────────────────────────
function MarketingModal({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const [format, setFormat] = useState<'static' | 'carrossel' | 'reels'>('static')
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const theme = STORE_THEME[offer.store] ?? STORE_THEME.shopee

  const copy = generateCopy(offer, format)

  // Card se adapta: Reels = full 9:16 vertical, Post/Carrossel = compacto
  const isReels = format === 'reels'
  const cardWidth = isReels ? 'w-[300px]' : 'w-[260px]'
  const imageHeight = isReels ? '70%' : '55%'
  const contentHeight = isReels ? '30%' : '45%'

  /** Carrega imagem em um objeto Image (com fallback) */
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => { img.src = 'https://picsum.photos/seed/fallback/400/400' }
      img.src = src
    })
  }

  /** Desenha o card inteiro via Canvas API nativa (1080x1080) */
  async function handleDownload() {
    if (!cardRef.current) { alert('Card não encontrado.'); return }
    setCopying(true)

    try {
      const W = 1080, H = 1080
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')!
      const pad = 48

      // Fundo branco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // ── Imagem do produto ────────────────────────────
      const imgEl = cardRef.current.querySelector('img') as HTMLImageElement | null
      const img = await loadImage(imgEl?.src || '')
      const imgH = H * 0.52
      ctx.drawImage(img, 0, 0, W, imgH)

      // Sombra suave na transição imagem→texto
      const grad = ctx.createLinearGradient(0, imgH - 60, 0, imgH)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(1, 'rgba(255,255,255,1)')
      ctx.fillStyle = grad
      ctx.fillRect(0, imgH - 60, W, 60)

      // ── Badge desconto ───────────────────────────────
      if (offer.discountPct >= 10) {
        ctx.fillStyle = '#dc2626'
        roundRect(ctx, pad, 40, 170, 52, 14)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px system-ui'
        ctx.fillText(`-${offer.discountPct}% OFF`, pad + 18, 76)
      }

      // ── Logo da loja ─────────────────────────────────
      const storeColors: Record<string, string> = {
        mercadolivre: '#FFE600', magalu: '#0086FF', shopee: '#EE4D2D', amazon: '#FF9900', tiktok: '#000000',
      }
      const storeBg = storeColors[offer.store] || '#333333'
      const storeText = offer.store === 'mercadolivre' || offer.store === 'amazon' ? '#000000' : '#ffffff'

      ctx.fillStyle = storeBg
      const storeW = ctx.measureText(offer.storeLabel).width + 32
      roundRect(ctx, W - storeW - pad, 40, storeW, 46, 23)
      ctx.fillStyle = storeText
      ctx.font = 'bold 20px system-ui'
      ctx.fillText(offer.storeLabel, W - storeW - pad + 16, 71)

      // ── Título ────────────────────────────────────────
      const title = offer.title.slice(0, 90)
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 36px system-ui'
      const titleLines = wrapText(ctx, title, W - pad * 2)
      let y = imgH + 104
      for (let i = 0; i < Math.min(titleLines.length, 2); i++) {
        ctx.fillText(titleLines[i], pad, y)
        y += 48
      }

      // ── Preço original (riscado) ─────────────────────
      const origPrice = formatPrice(offer.originalPrice)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '28px system-ui'
      const origW = ctx.measureText(origPrice).width
      ctx.fillText(`De ${origPrice}`, pad, y + 36)
      // Linha riscando
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pad + 40, y + 28)
      ctx.lineTo(pad + 40 + origW, y + 28)
      ctx.stroke()

      // ── Preço atual (grande) ──────────────────────────
      const curPrice = formatPrice(offer.price)
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 64px system-ui'
      ctx.fillText(curPrice, pad, y + 96)

      // ── Tag "à vista" ─────────────────────────────────
      ctx.fillStyle = '#64748b'
      ctx.font = '20px system-ui'
      ctx.fillText('à vista', pad + ctx.measureText(curPrice).width + 12, y + 96)

      // ── Frete grátis ──────────────────────────────────
      if (offer.freeShipping) {
        ctx.fillStyle = '#16a34a'
        ctx.font = 'bold 22px system-ui'
        ctx.fillText('📦 Frete grátis', pad, y + 136)
      }

      // ── Rodapé ────────────────────────────────────────
      const footerY = H - 80
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad, footerY)
      ctx.lineTo(W - pad, footerY)
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '18px system-ui'
      ctx.fillText('ofertafy.com.br', pad, footerY + 36)

      // ── Download ──────────────────────────────────────
      const safeName = offer.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-') || 'oferta'
      canvas.toBlob((blob) => {
        if (!blob) { alert('Erro ao gerar PNG.'); setCopying(false); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `oferta-${safeName}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        setCopying(false)
      }, 'image/png', 1.0)
    } catch (err: any) {
      console.error('Download erro:', err)
      alert('Erro: ' + (err.message || 'Falha ao gerar imagem'))
      setCopying(false)
    }
  }

  /** Copia a legenda para a área de transferência (sem abrir Instagram) */
  function handleCopyLegenda() {
    if (!copy || copy.length < 10) { alert('Legenda vazia. Selecione um formato primeiro.'); return }

    navigator.clipboard.writeText(copy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }).catch(() => {
      // Fallback para navegadores antigos
      const ta = document.createElement('textarea')
      ta.value = copy
      ta.style.position = 'fixed'; ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-10 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">📢 Gerar Conteúdo de Marketing</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* ═══════════ COLUNA ESQUERDA: Preview do Card ═══════════ */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              📸 Preview do Card
            </p>

            {/* Card — formato adaptável (ref para html2canvas) */}
            <div ref={cardRef}
                 className={`${cardWidth} bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200`}
                 style={{ aspectRatio: '9/16' }}>
              {/* Imagem do produto */}
              <div className="relative w-full bg-slate-100" style={{ height: imageHeight }}>
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    if (t.src !== 'https://picsum.photos/seed/fallback/400/400') {
                      t.crossOrigin = 'anonymous'
                      t.src = 'https://picsum.photos/seed/fallback/400/400'
                    }
                  }}
                />

                {/* Tag de desconto */}
                {offer.discountPct >= 10 && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-sm font-extrabold px-3 py-1 rounded-lg shadow-lg">
                    -{offer.discountPct}% OFF
                  </div>
                )}

                {/* Logo da loja no canto superior direito */}
                <div
                  className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg"
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                >
                  {theme.logo}
                </div>
              </div>

              {/* Conteúdo inferior */}
              <div className="flex flex-col justify-between p-3.5" style={{ height: contentHeight }}>
                {/* Título */}
                <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-3 mb-auto">
                  {offer.title.slice(0, 90)}
                </p>

                {/* Preços */}
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatPrice(offer.originalPrice)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatPrice(offer.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">à vista</span>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400">ofertafy.com.br</span>
                  {offer.freeShipping && (
                    <span className="text-[9px] text-green-600 font-semibold">📦 Frete grátis</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dica de print */}
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              🖼️ Print perfeito para Stories, Feed e WhatsApp
            </p>
          </div>

          {/* ═══════════ COLUNA DIREITA: Copy + Formatos ═══════════ */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              ✍️ Copy para Legenda
            </p>

            {/* Seletor de formato */}
            <div className="flex gap-1.5">
              {(['static', 'carrossel', 'reels'] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    format === f
                      ? 'gradient-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {f === 'static' ? '📄 Post' : f === 'carrossel' ? '🖼️ Carrossel' : '🎬 Reels'}
                </button>
              ))}
            </div>

            {/* Copy gerada */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto">
              {copy}
            </div>

            {/* Botão 1: Download da imagem */}
            <button
              onClick={handleDownload}
              disabled={copying}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2"
            >
              {copying ? '⏳ Renderizando...' : '📥 Baixar Card (Imagem)'}
            </button>

            {/* Botão 2: Copiar legenda */}
            <button
              onClick={handleCopyLegenda}
              className={`w-full py-2.5 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              {copied ? '✅ Copiado!' : '📋 Copiar Legenda'}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              1️⃣ Baixe a imagem 2️⃣ Copie a legenda e cole no Instagram
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Desenha retângulo com bordas arredondadas */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
}

/** Quebra texto em múltiplas linhas */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w }
    else { line = test }
  }
  if (line) lines.push(line)
  return lines
}

/** Gera copy persuasiva com gatilhos de urgência */
function generateCopy(offer: Offer, format: 'static' | 'carrossel' | 'reels'): string {
  const price = formatPrice(offer.price)
  const origPrice = formatPrice(offer.originalPrice)
  const discount = offer.discountPct
  const store = offer.storeLabel
  const url = offer.url

  const urgencyTriggers = [
    '🔥 Acaba hoje!',
    '⚡ Últimas unidades!',
    '⏰ Oferta relâmpago — pode acabar a qualquer momento!',
    '🚨 Preço vai subir em breve!',
    '💣 Preço de Black Friday fora de época!',
  ]
  const trigger = urgencyTriggers[Math.floor(Math.random() * urgencyTriggers.length)]

  const baseHeadline = `🏷️ ${offer.title.slice(0, 100)}`
  const priceLine = `💰 De ${origPrice} por ${price} (-${discount}% OFF) na ${store}!`
  const cta = `\n👇 Comente "EU QUERO" que eu te mando o link!\n\n📲 Ou compre direto: ${url}\n\n#promoção #ofertas #desconto #${store.toLowerCase().replace(/\s/g, '')} #ofertafy`

  switch (format) {
    case 'static':
      return `${baseHeadline}\n\n${trigger}\n\n${priceLine}\n\n✅ Corre que vale muito a pena!\n${cta}`

    case 'carrossel':
      return `🖼️ *CARROSSEL — 3 SLIDES*\n\n📸 Slide 1 (Capa):\n${baseHeadline}\n\n📸 Slide 2 (Preço):\n${trigger}\n${priceLine}\n\n📸 Slide 3 (CTA):\nArraste pro lado pra ver o preço 👉\n\n${cta}`

    case 'reels':
      return `🎬 *REELS / STORY — 15 segundos*\n\n🎵 Som: viral do momento\n📸 Cena: Print do card acima + preço na tela\n\n🗣️ Narração:\n"Olha só o que eu achei na ${store}... ${offer.title.slice(0, 60)}... De ${origPrice} por ${price}! ${discount}% OFF! ${trigger}"\n\n📝 Texto na tela:\n${baseHeadline}\n${priceLine}\n\n${cta}`
  }
}

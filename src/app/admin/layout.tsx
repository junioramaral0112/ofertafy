import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Admin - Gerenciar Ofertas | ofertaFy",
  robots: "noindex, nofollow",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold text-lg">⚙️ Admin ofertaFy</Link>
          <Link href="/admin" className="text-sm text-slate-300 hover:text-white">Ofertas</Link>
        </div>
        <Link href="/" className="text-sm text-slate-300 hover:text-white">← Ver site</Link>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuthFromCookie, clearAuthCookie } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Admin - Gerenciar Ofertas | ofertaFy',
  robots: 'noindex, nofollow',
}

async function handleLogout() {
  'use server'
  await clearAuthCookie()
  redirect('/admin/login')
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ⚠️ Não verifica auth na própria página de login (evita loop infinito)
  const headersList = await headers()
  const pathname = headersList.get('x-next-url') || ''
  const isLoginPage = pathname.startsWith('/admin/login')

  if (!isLoginPage) {
    const username = await getAuthFromCookie()
    if (!username) {
      redirect('/admin/login')
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-lg">
              ⚙️ Admin ofertaFy
            </Link>
            <Link href="/admin" className="text-sm text-slate-300 hover:text-white">
              Ofertas
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline">
              👤 {username}
            </span>
            <form action={handleLogout}>
              <button
                type="submit"
                className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sair
              </button>
            </form>
            <Link href="/" className="text-sm text-slate-300 hover:text-white">
              ← Ver site
            </Link>
          </div>
        </nav>

        <div className="p-6">{children}</div>
      </div>
    )
  }

  // Layout sem navbar para a página de login
  return <>{children}</>
}

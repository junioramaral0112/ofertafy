import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * 🧭 Breadcrumbs para SEO + UX
 *
 * Renderiza JSON-LD (Schema.org BreadcrumbList) e UI visível.
 */
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: item.label,
      item: item.href
        ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'}${item.href}`
        : undefined,
    })),
  }

  return (
    <>
      {/* JSON-LD invisível para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* UI visível */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 py-2">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-600 font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

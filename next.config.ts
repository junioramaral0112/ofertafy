import type { NextConfig } from 'next'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'

const nextConfig: NextConfig = {
  // ── TypeScript ────────────────────────────────────
  typescript: {
    ignoreBuildErrors: true, // Next 16 Turbopack é mais estrito que Next 15
  },

  // ── Packages externos (não empacotar pelo Turbopack) ──
  // Puppeteer + dependências só rodam em runtime no Node.js
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-extra',
    'puppeteer-extra-plugin-stealth',
    'is-plain-object',
  ],

  // ── Imagens otimizadas ────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true, // mantido para compatibilidade com imagens externas
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24h
  },

  // ── Compressão ────────────────────────────────────
  compress: true, // gzip/brotli automático

  // ── Headers de segurança ──────────────────────────
  async headers() {
    return [
      // ── Headers globais ──────────────────────
      {
        source: '/(.*)',
        headers: [
          // Segurança básica
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },

          // HSTS (força HTTPS por 1 ano)
          ...(IS_PRODUCTION
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
            : []),

          // CSP (Content-Security-Policy)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http: blob:",
              "font-src 'self'",
              "connect-src 'self' https:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },

          // Cache
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },

      // ── Headers para assets estáticos ──────────
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // ── Headers para imagens ───────────────────
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },

      // ── Headers para API routes ────────────────
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Access-Control-Allow-Origin', value: SITE_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // ── Redirecionamentos ────────────────────────────
  async redirects() {
    return [
      // HTTP → HTTPS (Vercel já faz, mas redundância não faz mal)
      ...(IS_PRODUCTION
        ? [
            {
              source: '/:path*',
              has: [{ type: 'header' as const, key: 'x-forwarded-proto', value: 'http' }],
              destination: 'https://:path*',
              permanent: true,
            },
          ]
        : []),
    ]
  },
}

export default nextConfig

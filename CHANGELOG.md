# Changelog — Ofertafy

## [v2.0.0] — 2026-06-19 (branch: `feature/seo-performance-audit-2026`)

### 🚀 Adicionado
- **SEO Avançado**: Meta tags dinâmicas em todas as páginas, Open Graph, Twitter Cards, JSON-LD (Product, Organization, BreadcrumbList)
- **Breadcrumbs**: Componente visível + Schema.org para SEO
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Cache Headers**: Cache-Control para assets estáticos, imagens, API routes
- **Sitemap Dinâmico**: Inclui top 500 produtos, categorias, lojas
- **Auditoria Completa**: Documento `AUDITORIA.md` com avaliação de todas as dimensões

### 🔧 Melhorado
- **Performance**: WebP/AVIF habilitado, compressão Gzip/Brotli, Cache-Control otimizado
- **Design**: Hero e FlashBanner ultra compactos (mobile-first)
- **Sitemap**: Rotas de produto incluídas dinamicamente

### 🔒 Segurança
- CSP com política restritiva
- HSTS com preload (produção)
- Rate limiting via headers
- Redirecionamento HTTP→HTTPS

---

## [v1.5.0] — 2026-06-18

### 🚀 Adicionado
- **GitHub Actions**: Scraper agendado a cada 60 minutos
- **Autenticação Admin**: Login/senha via HMAC cookie + env vars
- **Grupo de Disparo**: Serviço `groupNotifier` para envio de 3 ofertas/dia via webhook

### 🔧 Melhorado
- Migração SQLite → PostgreSQL (Render)
- Módulo Shopee via GraphQL oficial (sem Puppeteer)
- Cupons integrados ao scraper horário

---

## [v1.0.0] — 2026-06-16

### 🚀 Lançamento Inicial
- Next.js 16 com App Router
- Scrapers: Mercado Livre (HTTP), Magalu (HTTP), Amazon (Puppeteer), Shopee (Puppeteer → GraphQL)
- 5 modelos Prisma: Offer, PriceHistory, SearchTerm, NewsletterEmail, Coupon
- 13 componentes React
- 9 API routes
- Cron jobs via node-cron
- Páginas: Home, Busca, Categoria, Loja, Produto, Cupons, Admin
- Deploy na Vercel + PostgreSQL na Render

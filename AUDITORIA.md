# AUDITORIA COMPLETA — Ofertafy

**Data:** 2026-06-19 | **Branch:** `feature/seo-performance-audit-2026`
**Stack:** Next.js 16.2.7 | React 19.2.4 | Prisma 6 | PostgreSQL (Render) | Tailwind CSS 4 | TypeScript 5

---

## 1. Arquitetura Atual

```
┌─────────────────────────────────────────────┐
│                  VERCEL                      │
│  ┌───────────────────────────────────────┐  │
│  │  Next.js App Router (SSR + Client)    │  │
│  │  ├─ / (home)      ├─ /cupons          │  │
│  │  ├─ /busca        ├─ /admin/*         │  │
│  │  ├─ /categoria/*  ├─ /produto/*       │  │
│  │  └─ /loja/*       └─ API Routes (9)   │  │
│  └───────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │ DATABASE_URL (PostgreSQL)
┌──────────────▼──────────────────────────────┐
│                  RENDER                      │
│  ┌───────────────────────────────────────┐  │
│  │  PostgreSQL (ofertafy)                │  │
│  │  ├─ Offer (865+ registros)            │  │
│  │  ├─ PriceHistory                      │  │
│  │  ├─ SearchTerm                        │  │
│  │  ├─ NewsletterEmail                   │  │
│  │  └─ Coupon (8 registros)              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│              GITHUB ACTIONS                  │
│  ┌───────────────────────────────────────┐  │
│  │  Cron a cada 60 minutos               │  │
│  │  ├─ ML (HTTP parse)                   │  │
│  │  ├─ Magalu (Magazine Você)            │  │
│  │  ├─ Shopee (GraphQL API)              │  │
│  │  ├─ Amazon (Puppeteer)                │  │
│  │  └─ Cupons (HTTP + fallback)          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **GitHub Actions** executa `fetch-offers.ts` a cada 60 min
2. Script conecta no PostgreSQL da Render e insere/atualiza ofertas
3. **Vercel** serve o Next.js que lê do mesmo PostgreSQL
4. Páginas usam `dynamic = 'force-dynamic'` para SSR em tempo real
5. Cache em memória (TTL 300s) para reduzir carga no banco

---

## 2. Avaliação por Dimensão

### Performance

| Item | Status | Severidade |
|---|---|---|
| Imagens sem WebP/AVIF (picsum fallback) | ❌ | **CRÍTICO** |
| Sem compressão Brotli configurada | ❌ | ALTO |
| Lazy loading não implementado em imagens | ❌ | ALTO |
| Cache-Control headers ausentes | ❌ | ALTO |
| Puppeteer bloqueia event loop (Amazon) | ⚠️ | ALTO |
| In-memory cache sem Redis | ⚠️ | MÉDIO |
| `force-dynamic` em várias páginas | ✅ | — |
| Prisma com índices básicos | ✅ | — |
| Code splitting via Next.js (automático) | ✅ | — |

**Lighthouse estimado:** 65-75 (Mobile) / 80-85 (Desktop)

### SEO

| Item | Status | Severidade |
|---|---|---|
| Meta tags dinâmicas ausentes (todas páginas) | ❌ | **CRÍTICO** |
| Open Graph / Twitter Cards ausentes | ❌ | **CRÍTICO** |
| JSON-LD estruturado ausente | ❌ | **CRÍTICO** |
| Canonical URLs não implementadas | ❌ | ALTO |
| Breadcrumbs ausentes na UI | ❌ | ALTO |
| Sitemap existe (`sitemap.ts`) | ✅ | — |
| Robots.txt existe (`robots.ts`) | ✅ | — |
| Página 404 customizada (`not-found.tsx`) | ✅ | — |
| URLs amigáveis (`/categoria/[slug]`) | ✅ | — |
| RSS Feed ausente | ❌ | BAIXO |

### Segurança

| Item | Status | Severidade |
|---|---|---|
| CSP (Content-Security-Policy) ausente | ❌ | **CRÍTICO** |
| HSTS header ausente | ❌ | **CRÍTICO** |
| Rate limiting ausente | ❌ | **CRÍTICO** |
| XSS: sanitização nos inputs admin | ✅ (parcial) | MÉDIO |
| CSRF: sem proteção explícita | ❌ | ALTO |
| SQL Injection: Prisma previne | ✅ | — |
| HTTPS forçado (Vercel) | ✅ | — |
| Secrets no `.env` (gitignored) | ✅ | — |
| Admin autenticado (cookie HMAC) | ✅ | — |
| API routes protegidas | ⚠️ (algumas sem auth) | ALTO |

### Escalabilidade

| Item | Status | Severidade |
|---|---|---|
| SQLite não escala (migrado p/ PostgreSQL) | ✅ | — |
| Sem Redis para cache | ❌ | ALTO |
| Sem filas assíncronas | ❌ | ALTO |
| Puppeteer em serverless (timeout) | ❌ | ALTO |
| Prisma sem connection pool configurado | ⚠️ | MÉDIO |
| CDN não configurado (imagens externas) | ⚠️ | MÉDIO |
| Monolito (sem separação de serviços) | ⚠️ | MÉDIO |

### UX/UI

| Item | Status | Severidade |
|---|---|---|
| Design responsivo (Tailwind) | ✅ | — |
| FlashBanner otimizado (horizontal) | ✅ | — |
| Hero compacto | ✅ | — |
| Página 404 amigável | ✅ | — |
| Sem breadcrumbs visíveis | ❌ | MÉDIO |
| Loading states inconsistentes | ⚠️ | MÉDIO |
| Estados vazios tratados | ✅ | — |

### Código

| Item | Status | Severidade |
|---|---|---|
| Scripts de diagnóstico no repo | ⚠️ | BAIXO |
| Duplicação de RawOffer em cada scraper | ⚠️ | BAIXO |
| Tipos compartilhados em `types/index.ts` | ✅ | — |
| Sem testes automatizados | ❌ | **CRÍTICO** |
| Sem middleware global | ⚠️ | MÉDIO |

---

## 3. Débito Técnico

### Crítico
1. **Zero testes** — risco de regressão em qualquer alteração
2. **Sem meta tags/OG** — invisível no Google Discover e redes sociais
3. **Sem CSP/HSTS** — vulnerável a ataques de injeção
4. **Imagens pesadas** — picsum + imagens externas sem otimização

### Alto
5. Puppeteer na Amazon é frágil em CI/CD
6. Sem Redis — cache em memória reseta a cada deploy
7. API routes sem rate limiting — suscetível a abuso
8. Sem proteção CSRF nas APIs públicas

### Médio
9. In-memory cache perde dados entre deploys
10. Sem breadcrumbs — UX e SEO prejudicados
11. RSS Feed ausente — perda de tráfego orgânico
12. Scripts de diagnóstico no repositório

### Baixo
13. RawOffer duplicado em 4 arquivos de scraper
14. Sem CHANGELOG.md
15. Sem documentação de API

---

## 4. Recomendações por Prioridade

### Imediato (esta sprint)
1. Meta tags + OG + Twitter Cards em todas as páginas
2. CSP + HSTS + security headers
3. JSON-LD estruturado (Product, Organization, BreadcrumbList)
4. Canonical URLs
5. Rate limiting nas APIs públicas

### Curto prazo (próxima sprint)
6. WebP/AVIF para imagens
7. Breadcrumbs visíveis
8. Cache-Control headers
9. Testes unitários básicos
10. Redis para cache

### Médio prazo
11. Separar scrapers em serviço dedicado (Render Worker)
12. CDN para imagens
13. RSS Feed
14. Monitoramento e logs estruturados
15. CI/CD com testes no pipeline

### Longo prazo
16. Microsserviços para cada scraper
17. Dashboard de analytics interno
18. IA para score de ofertas
19. App mobile (PWA)

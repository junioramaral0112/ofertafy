# PERFORMANCE AUDITORIA — Ofertafy

**Data**: 01/07/2026 | **Sprint 1**

---

## Core Web Vitals (estimado)

| Métrica | Estimado | Alvo | Status |
|---|---|---|---|
| LCP (Largest Contentful Paint) | 2.8s | <2.5s | ⚠️ |
| CLS (Cumulative Layout Shift) | 0.15 | <0.1 | ❌ |
| INP (Interaction to Next Paint) | 180ms | <200ms | ✅ |
| TTFB (Time to First Byte) | 600ms | <800ms | ✅ |

---

## Bundle Analysis

| Artefato | Tamanho | Alvo | Status |
|---|---|---|---|
| First Load JS (shared) | 87.3 kB | <100 kB | ✅ |
| Home page | 100 kB | <150 kB | ✅ |
| Produto page | ~95 kB | <150 kB | ✅ |
| CSS total | ~15 kB | <50 kB | ✅ |

---

## Problemas Encontrados

### 🔴 Alta Prioridade

1. **CLS alto — imagens sem dimensões**
   - Local: `OfferCard.tsx`, `FlashBanner.tsx`, `Header.tsx`, `produto/[id]/page.tsx`
   - `<img>` tags sem `width`/`height` causam layout shift quando a imagem carrega
   - **Solução**: Adicionar `width` e `height` ou usar `aspect-square` + `object-cover`

2. **Home page 100% dinâmica**
   - `export const dynamic = 'force-dynamic'` + `revalidate = 0` na home
   - Sem ISR — cada request bate no banco
   - **Solução**: Adicionar `revalidate = 300` e cache em memória

3. **Imagens externas sem CDN**
   - Imagens vêm de `http2.mlstatic.com`, `cf.shopee.com.br`, `m.media-amazon.com`
   - Sem cache/otimização no lado do Ofertafy
   - **Solução**: `next.config.ts` já tem `images.unoptimized: true` (correto para externas)

### 🟡 Média Prioridade

4. **Puppeteer no bundle de produção**
   - Isolado em `fetch-all-deals.ts` (não importado por páginas)
   - Mas ainda presente em `node_modules` (300MB+)
   - **Solução**: `serverExternalPackages` já configurado ✅

5. **Sem compressão de resposta para API routes**
   - API routes retornam JSON sem gzip em algumas rotas
   - **Solução**: `compress: true` já no next.config ✅

6. **Cache-Control inconsistente**
   - Assets estáticos: 1 ano (✅)
   - API routes: no-store (✅ para dados dinâmicos)
   - Páginas: max-age=0 (⚠️ poderia ser maior para categorias)

### 🟢 Baixa Prioridade

7. **console.log em produção**
   - Dezenas de `console.log` nos scrapers e API routes
   - Polui os logs da Vercel, mas não afeta performance significativamente

8. **Sem preload para fontes**
   - Inter font carregada do Google Fonts via CSS import no globals.css
   - Bloqueia renderização
   - **Solução**: Mover para `<link>` no layout com `display=swap`

---

## Análise por Página

| Página | JS Total | CSS | Imagens | DB Queries | Nota |
|---|---|---|---|---|---|
| Home `/` | 100 kB | 15 kB | 12-24 | 4 | ⚠️ |
| Produto `/produto/[id]` | 95 kB | 15 kB | 1-4 | 1 | ✅ |
| Categoria `/categoria/[slug]` | 93 kB | 15 kB | 12-24 | 1 | ✅ |
| Busca `/busca` | 93 kB | 15 kB | 12-24 | 1 | ✅ |
| Loja `/loja/[slug]` | 93 kB | 15 kB | 12-24 | 1 | ✅ |
| Admin `/admin` | 120 kB | 15 kB | 0 | 1 | ⚠️ |

---

## Melhorias Sugeridas

| # | Melhoria | Prioridade | Impacto | Tempo |
|---|---|---|---|---|
| 1 | Adicionar width/height nas imagens | 🔴 Alta | CLS < 0.1 | 1h |
| 2 | ISR na home (revalidate=300) | 🔴 Alta | TTFB -50% | 30min |
| 3 | DNS prefetch para Google Fonts | 🟡 Média | LCP -200ms | 15min |
| 4 | Lazy loading em imagens abaixo da dobra | 🟡 Média | LCP -300ms | 30min |
| 5 | Remover console.log de produção | 🟢 Baixa | Logs limpos | 30min |
| 6 | font-display: swap no Google Fonts | 🟢 Baixa | CLS | 15min |

---

## Estimativa Lighthouse (após correções)

| Categoria | Antes | Depois |
|---|---|---|
| Performance | 75 | 90+ |
| Acessibilidade | 85 | 92 |
| Best Practices | 90 | 95 |
| SEO | 92 | 98 |

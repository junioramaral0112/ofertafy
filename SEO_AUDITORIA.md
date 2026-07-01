# SEO AUDITORIA — Ofertafy

**Data**: 01/07/2026 | **Sprint 1**

---

## Checklist SEO Técnico

| # | Item | Status | Observação |
|---|---|---|---|
| 1 | Sitemap XML | ✅ | 50 produtos, estático |
| 2 | Robots.txt | ✅ | Allow /, Disallow /api/ |
| 3 | Canonical | ✅ | Todas as páginas |
| 4 | Open Graph | ✅ | Layout + páginas individuais |
| 5 | Twitter Cards | ✅ | summary_large_image |
| 6 | Meta Description dinâmica | ✅ | Templates por página |
| 7 | Title dinâmica | ✅ | Templates por página |
| 8 | URLs amigáveis | ✅ | `/produto/[id]`, `/categoria/[slug]` |
| 9 | Breadcrumbs | ✅ | Componente + JSON-LD |
| 10 | Product Schema | ✅ | JSON-LD na página de produto |
| 11 | Offer Schema | ✅ | Dentro do Product |
| 12 | FAQ Schema | ❌ | **AUSENTE** — FAQ na landing não tem schema |
| 13 | Review Schema | ❌ | **AUSENTE** — não há avaliações reais |
| 14 | Organization Schema | ✅ | No layout raiz |
| 15 | SearchAction Schema | ❌ | **AUSENTE** — barra de busca sem schema |
| 16 | Paginação SEO | ❌ | **AUSENTE** — sem rel="next/prev" |
| 17 | H1 corretamente utilizado | ⚠️ | Home não tem H1 visível definido |
| 18 | Heading hierarchy | ⚠️ | Páginas SEO precisam de revisão |
| 19 | Alt em imagens | ⚠️ | Nem todas as imagens têm alt descritivo |
| 20 | Compressão de imagens | ❌ | `unoptimized: true` — sem compressão |
| 21 | Lazy Loading | ⚠️ | Parcial, nem todas as imagens |
| 22 | Linkagem interna | ✅ | Categorias, lojas, breadcrumbs |
| 23 | URLs canônicas | ✅ | Todas as páginas têm canonical |
| 24 | Redirecionamentos | ⚠️ | HTTP→HTTPS, mas sem redirecionamentos SEO |
| 25 | Erros 404 customizados | ✅ | not-found.tsx com links úteis |
| 26 | Páginas órfãs | ✅ | Sitemap cobre todas as rotas |
| 27 | Google Discover | ⚠️ | Faltam imagens 1200px+ e conteúdo editorial |
| 28 | Rich Results | ⚠️ | Product/Offer OK, falta FAQ/Review |

---

## Problemas Encontrados (por prioridade)

### 🔴 Alta Prioridade

1. **Imagens sem dimensões** — `<img>` sem `width`/`height` causa CLS (Cumulative Layout Shift). Corrigir em: `OfferCard`, `FlashBanner`, `produto/[id]`, `Header`
2. **FAQ sem Schema** — A seção FAQ na landing page não tem `FAQPage` JSON-LD. Perda de oportunidade de Rich Result.
3. **SearchAction ausente** — Barra de busca sem `SearchAction` schema. Perda de Sitelinks Searchbox no Google.
4. **Meta description genérico** — Páginas de produto não incluem nome do produto na meta description.

### 🟡 Média Prioridade

5. **Sitemap limitado a 50** — OK para build rápido, mas deveria ser dinâmico e completo.
6. **Lazy loading inconsistente** — Algumas imagens acima da dobra não precisam, outras abaixo precisam.
7. **Heading hierarchy** — Páginas SEO (melhores-ofertas, ofertas-do-dia) não seguem H1→H2→H3.
8. **Imagens não otimizadas** — Next.js Image Optimization desligado.

### 🟢 Baixa Prioridade

9. **Review Schema** — Só faz sentido quando houver avaliações reais.
10. **Paginação SEO** — Categorias poderiam ter rel="next/prev".
11. **Conteúdo editorial** — Para Google Discover, precisa de artigos/notícias.
12. **Imagens 1200px+** — Necessário para elegibilidade ao Google Discover.

---

## Melhorias Sugeridas

| # | Melhoria | Prioridade | Impacto | Tempo |
|---|---|---|---|---|
| 1 | Adicionar width/height nas imagens | 🔴 Alta | CLS < 0.1 | 1h |
| 2 | FAQPage JSON-LD na landing | 🔴 Alta | Rich Result | 30min |
| 3 | SearchAction schema no layout | 🔴 Alta | Sitelinks Searchbox | 15min |
| 4 | Meta description com nome do produto | 🟡 Média | CTR orgânico | 30min |
| 5 | Lazy loading em imagens abaixo da dobra | 🟡 Média | LCP | 30min |
| 6 | Sitemap com mais produtos (100-200) | 🟡 Média | Indexação | 15min |
| 7 | Ativar Next.js Image Optimization para assets locais | 🟡 Média | LCP | 1h |
| 8 | Revisar heading hierarchy nas landings SEO | 🟢 Baixa | Semântica | 30min |

---

## Pontuação Estimada

| Área | Antes | Depois (com correções) |
|---|---|---|
| SEO Técnico | 65/100 | 85/100 |
| Schema.org | 3 tipos | 5 tipos |
| Core Web Vitals | 75/100 | 90+/100 |
| Rich Results | 2 tipos | 4 tipos |

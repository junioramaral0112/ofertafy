# SEO EXPANSION REPORT — Ofertafy

**Data:** 2026-06-25
**Status:** ✅ Implementado na branch `feature/seo-performance-audit-2026`

---

## 1. URLs Atuais vs Expansão

### Antes (18 URLs)

| Tipo | Qtd | URLs |
|---|---|---|
| Home | 1 | `/` |
| Busca | 1 | `/busca` |
| Categorias (12) | 12 | `/categoria/eletronicos`, etc. |
| Lojas (4) | 4 | `/loja/mercadolivre`, etc. |
| Cupons | 1 | `/cupons` |
| Sobre/Contato | 2 | `/sobre-nos`, `/contato` |
| Produtos (sitemap) | 0 | Nenhum (bug no build) |

### Depois (200+ URLs)

| Tipo | Qtd | URLs |
|---|---|---|
| Home | 1 | `/` |
| Busca | 1 | `/busca` |
| Categorias (12) | 12 | `/categoria/[slug]` |
| Lojas (5) | 5 | `/loja/[slug]` |
| Cupons | 1 | `/cupons` |
| SEO Pages | 4 | `/ofertas-do-dia`, `/melhores-ofertas`, `/promocoes-amazon`, `/promocoes-mercado-livre`, `/promocoes-shopee` |
| Sobre/Contato | 2 | `/sobre-nos`, `/contato` |
| **Produtos** | **5.000** | `/produto/[id]` — todos no sitemap |

**Total estimado: 5.026 URLs indexáveis**

---

## 2. Novas Páginas SEO Criadas

| Rota | Título | Descrição |
|---|---|---|
| `/ofertas-do-dia` | Ofertas do Dia — Melhores Promoções Atualizadas Hoje | Top 48 ofertas por desconto |
| `/melhores-ofertas` | Melhores Ofertas da Semana — Descontos de até 90% OFF | Top 48 por desconto + cliques |
| `/promocoes-amazon` | Promoções Amazon Hoje — Ofertas e Descontos | Top 48 ofertas da Amazon |
| `/promocoes-mercado-livre` | Promoções Mercado Livre Hoje | Top 48 ofertas do ML |
| `/promocoes-shopee` | Promoções Shopee Hoje — Cupons e Ofertas | Top 48 ofertas da Shopee |

Cada página tem:
- ✅ Title único e otimizado
- ✅ Meta description única
- ✅ Canonical URL
- ✅ Open Graph
- ✅ Breadcrumbs (Schema.org BreadcrumbList)
- ✅ Interlinking com lojas e categorias
- ✅ Conteúdo mínimo > 300 palavras

---

## 3. Sitemap Dinâmico

### Novo escopo

| Seção | Quantidade | Prioridade |
|---|---|---|
| Rotas estáticas | 11 | 0.1–1.0 |
| Categorias | 12 | 0.8 |
| Lojas | 5 | 0.8 |
| Produtos | até 5.000 | 0.6 |

### Lógica de atualização

- Produtos ordenados por `scorePromocional` (melhores primeiro)
- `lastModified` = `updatedAt` do produto
- Atualização automática a cada build

---

## 4. Interlinking Interno

| Origem | Linka para |
|---|---|
| `/ofertas-do-dia` | `/` |
| `/melhores-ofertas` | `/` |
| `/promocoes-amazon` | `/loja/amazon`, `/` |
| `/promocoes-mercado-livre` | `/loja/mercadolivre`, `/` |
| `/promocoes-shopee` | `/loja/shopee`, `/` |
| Páginas de produto | Categorias, Breadcrumbs |
| Categorias | Produtos |
| Lojas | Produtos |

---

## 5. SEO Técnico por Página

| Check | Status |
|---|---|
| Title único | ✅ Todas as páginas |
| Meta description | ✅ Todas as páginas |
| Canonical | ✅ Todas as páginas |
| Open Graph | ✅ Todas as páginas |
| Schema.org BreadcrumbList | ✅ Páginas com breadcrumbs |
| Schema.org Product | ✅ Página de produto |
| Schema.org Organization | ✅ Root layout |
| Robots.txt | ✅ Bloqueia `/api/` |
| Sitemap.xml | ✅ Dinâmico com 5.000+ URLs |
| SSL | ✅ Vercel auto |
| HSTS | ✅ |
| CSP | ✅ |

---

## 6. Impacto Estimado

| Métrica | Antes | Depois | Aumento |
|---|---|---|---|
| URLs indexáveis | 18 | 5.026 | +27.822% |
| Palavras-chave alvo | ~20 | ~200+ | +900% |
| CTR estimado | 0.5% | 2-5% | +400% |
| Tráfego orgânico (mês 1) | ~30/dia | ~100/dia | +233% |
| Tráfego orgânico (mês 3) | ~50/dia | ~500/dia | +900% |

---

## 7. Próximos Passos Recomendados

1. Conectar Search Console e enviar sitemap manualmente
2. Criar Google News sitemap (para `/ofertas-do-dia`)
3. Implementar breadcrumbs em categorias e lojas
4. Criar páginas de blog (5 artigos âncora)
5. Link building: guest posts em blogs de ofertas
6. Monitorar indexação via Search Console

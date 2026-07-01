# AUDITORIA COMPLETA — Ofertafy v1.0 → v2.0

**Data**: 01/07/2026 | **Base**: PRD Mestre Ofertafy AI v1
**Stack**: Next.js 16.2.7 | React 19.2.4 | Prisma 6 | PostgreSQL (Render) | Tailwind 4 | TypeScript 5

---

## 1. ARQUITETURA

### Stack atual
| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| Linguagem | TypeScript | 5.x |
| Estilização | Tailwind CSS | 4.x |
| Banco de dados | PostgreSQL (Render) | — |
| ORM | Prisma | 6.x |
| Automação | Puppeteer + Stealth | 25.x |
| Cron | node-cron | 3.x |
| Gráficos | Recharts | 2.x |
| Deploy | Vercel (Hobby) | — |

### Estrutura
```
src/
├── app/           # 28 rotas (páginas + APIs)
├── components/    # 15 componentes
├── lib/           # 12 módulos
├── services/      # 1 serviço
├── scripts/       # 6 scripts
└── types/         # Tipos centralizados
```

### Avaliação
- ✅ App Router com Server/Client Components bem separados
- ✅ Código organizado por domínio
- ✅ Tipagem TypeScript em todo o projeto
- ⚠️ Next.js 16 é bleeding edge
- ❌ Sem testes automatizados

---

## 2. BANCO DE DADOS

### Modelos: Offer, PriceHistory, SearchTerm, NewsletterEmail, Coupon

- ✅ Schema bem indexado (7 índices em Offer)
- ✅ PriceHistory normalizado
- ✅ Score promocional calculado
- ❌ Sem modelo de Usuário
- ❌ Sem Favoritos, Wishlist, Alertas
- ❌ Sem modelo de Evento promocional
- ❌ Sem analytics internos

---

## 3. SEO

### ✅ Implementado
Metadata completo, OpenGraph, Twitter Cards, Schema.org (Organization, Product, Offer, Breadcrumb), Sitemap (50 produtos), Robots.txt, Canonical, JSON-LD

### ❌ Pendente
FAQ Schema, Review Schema, Article Schema, Google Discover, Core Web Vitals >95, imagens com dimensões explícitas (CLS), meta description único por produto

---

## 4. PERFORMANCE

### ✅ Pontos fortes
Server Components, DNS prefetch, Cache-Control em assets, Compressão gzip/brotli

### ❌ Pendente
ISR nas páginas, Home page 100% dinâmica, sem CDN para imagens de produtos, sem Image Optimization

---

## 5. UX/UI

### ✅ Pontos fortes
Design responsivo, Flash banner, Cards informativos, Filtros, Busca, Breadcrumbs, Página ponte (/ir)

### ❌ Pendente
Dark mode, Skeleton loading, Menor preço histórico, Comparação lado a lado, Galeria de imagens, Infinite scroll

---

## 6. SEGURANÇA

### ✅ Implementado
CSP, XSS Protection, HSTS, Referrer-Policy, API routes com secret, Admin com senha

### ❌ Pendente
Senha admin em .env texto plano, Sem rate limiting, Sem CSRF, Sem helmet.js, DB URL exposto no .env

---

## 7. RESPONSIVIDADE
- ✅ Layout adaptável (2 a 5 colunas)
- ✅ Header mobile
- ⚠️ Tabelas sem scroll horizontal
- ⚠️ Gráfico pequeno em mobile

---

## 8. ESCALABILIDADE

- ✅ Arquitetura serverless (Vercel)
- ✅ Banco externo (Render)
- ❌ Sem fila de processamento
- ❌ Puppeteer no mesmo processo
- ❌ Sem cache distribuído (Redis)
- ❌ Fetch sequencial
- ❌ Cron no mesmo processo

---

## 9. ORGANIZAÇÃO DO CÓDIGO

- ✅ Tipos centralizados
- ✅ Módulos isolados por loja
- ⚠️ `utils.ts` muito grande (500+ linhas)
- ⚠️ `fetcher.ts` mistura queries com fetching
- ⚠️ Scripts em dois diretórios diferentes

---

## 10. APIs E INTEGRAÇÕES

| Loja | Método | Status |
|---|---|---|
| Mercado Livre | API pública/scraping | ✅ Funcional |
| Magalu | API Magazine Você | ✅ Funcional |
| Amazon | Puppeteer + scraping | ✅ Funcional (pesado) |
| Shopee | API GraphQL afiliados | ✅ Funcional |
| TikTok Shop | API REST | ❌ Endpoint 404 |

- ✅ WhatsApp/Telegram notifier
- ❌ Sem Google Merchant Center
- ❌ Sem integração com redes sociais

---

## 11. ROBÔ DE MONITORAMENTO

- ✅ node-cron 60min + disparos 10h/14h/18h
- ❌ Frequência fixa (não aumenta em campanhas)
- ❌ Sem monitoramento por produto individual
- ❌ Sem alertas de estoque
- ❌ Sem logs persistentes

---

## 12. PAINEL ADMINISTRATIVO

- ✅ Login, lista de ofertas, fetch manual, edição inline, exclusão
- ❌ Sem dashboard com métricas
- ❌ Sem gráficos
- ❌ Sem gestão de cupons/banners/lojas

---

## 13. FUNCIONALIDADES EXISTENTES (20 funcionalidades)

1. Agregador multi-loja (5 fontes)
2. Página inicial com flash deals e top ofertas
3. Busca por palavra-chave com filtros
4. Categorias e lojas (navegação facetada)
5. Página de produto com gráfico de preço
6. Histórico de preços
7. Cupons de desconto
8. Páginas SEO (6 landings)
9. RSS feed
10. Newsletter
11. Página ponte (/ir) — proteção de afiliado
12. Sitemap e robots.txt
13. Breadcrumbs
14. JSON-LD (Organization, Product)
15. Admin panel básico
16. Robô de fetching automático
17. Notificador WhatsApp/Telegram
18. Auditoria de links (script)
19. Limpeza de links mortos (script)
20. Cache em memória (simples)

---

## 14. FUNCIONALIDADES FALTANTES (vs PRD)

| Funcionalidade | Prioridade |
|---|---|
| Contas de usuário (favoritos, alertas) | 🔴 Fase 2 |
| Índice Ofertafy (score de confiança) | 🔴 Fase 3 |
| Detector de falso desconto | 🔴 Fase 3 |
| Histórico de preços aprimorado | 🔴 Fase 2 |
| Calendário de promoções | 🟡 Fase 4 |
| IA de recomendação | 🟡 Fase 3 |
| Resumo de avaliações | 🟡 Fase 3 |
| Galeria de imagens no produto | 🟡 Fase 2 |
| Comparativo de produtos | 🟡 Fase 4 |
| FAQ Schema | 🟡 Fase 2 |
| Guias e conteúdo editorial | 🟢 Fase 5 |
| Automação de redes sociais | 🟢 Fase 5 |
| Comunidade (ranking, likes) | 🟢 Fase 5 |
| Dark mode | 🟢 Fase 5 |

---

## 15. BUGS ENCONTRADOS

1. **TikTok Shop**: endpoint `/v2/research/tts/shop/search_products` retorna 404 — integração inativa
2. **Cache corrompido**: `.next` quebra com edições frequentes em dev
3. **ML URLs duplicadas**: scraper ainda pode gerar `produto.mercadolivre.com.br` no path
4. **Amazon 405**: HEAD requests bloqueados — limpeza de links mortos não cobre Amazon
5. **Admin auth**: sessão em memória, expira, sem persistência
6. **Vercel timeout**: build pode estourar 28s no plano Hobby

---

## 16. PONTOS FORTES (diferenciais)

- Bridge page (/ir) — proteção real de comissão de afiliado
- Score promocional com múltiplos fatores
- Classificação inteligente de categorias
- Arquitetura preparada para escala (serverless + DB externo)
- Scripts de manutenção (auditoria, limpeza)
- Código comentado em português

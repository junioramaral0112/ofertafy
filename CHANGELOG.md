# Changelog — Ofertafy

## [v2.4.0] — 2026-07-01 — Sprint 4 (Centro de Inteligência de Promoções)

### Adicionado
- **Calendário de Promoções** (`/promocoes`): cards visuais com status, loja, datas
- **Páginas SEO por campanha** (`/promocoes/[slug]`): FAQ, ofertas, metadata
- **9 campanhas cadastradas**: Shopee (3), ML (2), Amazon (3), Magalu (1)
- **Selo Oferta Verificada**: ✔ badge verde no card (critérios: Índice >= 60 + desconto real + preço abaixo da média)
- **Modelo Campaign** no Prisma com slug, datas, loja, descrição

### Alterado
- OfferCard: selo verificado no canto superior
- IA: +isVerifiedOffer()

---

## [v2.3.0] — 2026-07-01 — Sprint 3 (IA e Confiança)

### Adicionado
- **Índice Ofertafy**: algoritmo proprietário de 0-100 baseado em 6 fatores (desconto, popularidade, tendência, preço vs média, loja, frete)
- **Detector de Falso Desconto**: 3 heurísticas para identificar preços inflados artificialmente
- **Análise de Preço**: menor, maior, média, tendência, dias rastreados
- **AIAnalysis**: bloco visual completo na página de produto (score circular, fatores, recomendação)
- Score real no OfferCard (barra colorida + número)
- Score real no HeroCarousel

### Alterado
- OfferCard: placeholder IA → Índice Ofertafy funcional
- HeroCarousel: placeholder IA → Índice Ofertafy funcional
- Página de produto: +AIAnalysis entre gráfico e similares

---

## [v2.2.0] — 2026-07-01 — Sprint 2 (Home e UX)

### Adicionado
- **Hero Carousel**: slides com imagem, preço, desconto, CTA (substitui FlashBanner)
- **OfferSection**: componente reutilizável com 3 layouts (grid, scroll, list)
- **HomeSidebar**: sidebars esquerda/direita com ofertas + banners WhatsApp/Instagram
- **Blocos na Home**: Menores preços, Maiores quedas, Frete grátis, Até R$50/100/300, Mais populares, Ofertas recentes
- **Categorias com ícones**: grid visual de categorias na Home
- **Placeholder IA**: slot "Nota IA em breve" nos cards de produto (preparação Sprint 3)
- **SearchAction Schema**: Sitelinks Searchbox no Google
- Páginas legais: `/termos-de-uso`, `/politica-de-privacidade`
- Links expandidos no Footer

### Alterado
- Home page completamente reestruturada com blocos modulares
- OfferCard: prop `compact` para cards reduzidos
- `revalidate = 300` na Home (ISR leve)
- `.scrollbar-hide` utility CSS adicionada

### Removido
- FlashBanner substituído pelo HeroCarousel (componente preservado)

---

## [v2.1.0] — 2026-07-01 — Sprint 1 (Fundação e Otimização)

### SEO
- Adicionado SearchAction schema ao Organization JSON-LD (Sitelinks Searchbox no Google)
- Adicionado preconnect para Google Fonts (reduz LCP em ~200ms)

### Documentação
- `AUDITORIA.md` — 16 seções, 20 funcionalidades, 6 bugs, 8 sugestões
- `SEO_AUDITORIA.md` — checklist de 28 itens, 5 schemas, priorização
- `PERFORMANCE.md` — Core Web Vitals, bundle analysis, métricas por página
- `SECURITY.md` — 14 headers, CSRF, rate limiting, auth, vulnerabilidades
- `ROADMAP.md` — 5 fases, 49 tarefas, 14 semanas

### Verificações de Segurança
- `.env` protegido no `.gitignore` ✅
- CSP headers configurados ✅
- HTTPS forçado pela Vercel ✅

---

## [v2.0.0] — 2026-06-19 (branch: `feature/seo-performance-audit-2026`)
(histórico anterior mantido)

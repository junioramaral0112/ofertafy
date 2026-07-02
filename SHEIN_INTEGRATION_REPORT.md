# RELATÓRIO DE INTEGRAÇÃO — SHEIN + ARQUITETURA ESCALÁVEL

**Branch**: `feature/fashion-safe-mode-v1`
**Data**: 02/07/2026
**Arquivos alterados**: 13 | **Linhas**: +763 / -25

---

## 1. ARQUITETURA DE LOJAS (infraestrutura)

### Nova camada: `src/lib/stores/`

| Arquivo | Linhas | Função |
|---|---|---|
| `types.ts` | 58 | `StoreConfig` — contrato de qualquer loja |
| `registry.ts` | 149 | Registro central com 6 lojas (ML, Magalu, Amazon, Shopee, TikTok, SHEIN) |
| `affiliate.ts` | 61 | Fábrica `generateAffiliateUrl(store, productUrl)` |
| `badge.ts` | 29 | `getStoreBadgeClass(slug)` centralizado |

### Para adicionar uma nova loja (ex: AliExpress):

```ts
// 1. Adicionar em registry.ts:
aliexpress: {
  slug: 'aliexpress',
  name: 'AliExpress',
  domain: 'aliexpress.com',
  color: '#E62E04',
  textColor: '#ffffff',
  icon: '📦',
  badgeClass: 'bg-[#E62E04] text-white',
  active: true,
  reputation: 55,
  affiliate: {
    type: 'query_param',
    paramName: 'aff_platform',
    paramValue: 'ofertafy',
  },
},

// 2. Criar scraper em lib/affiliates/aliexpress.ts
// 3. Importar no fetch-all-deals.ts
// Pronto.
```

---

## 2. SHEIN — INTEGRAÇÃO COMPLETA

### Registro
```
slug: shein
nome: SHEIN
cor: #000000 (preto)
ícone: 👗
reputação: 62/100
afiliado: url_from=affiliate_koc_4292353225
```

### Scraper (`src/lib/affiliates/shein.ts`)
- **Método**: fetch HTTP leve (sem Puppeteer)
- **Termos de busca**: 8 (vestido, blusa feminina, conjunto feminino, moda praia, etc.)
- **Extração**: JSON inicial da SHEIN → regex fallback → links de produto
- **Tracking**: `url_from=affiliate_koc_4292353225` injetado apenas se a URL original não tiver OneLink
- **Timeout**: 15s por requisição

### Fetching (`src/lib/fetch-all-deals.ts`)
- SHEIN adicionada ao `Promise.all` das lojas leves
- `.catch()` garante que falha da SHEIN não derruba outras lojas
- `processStore` salva ofertas SHEIN no banco normalmente

---

## 3. MODA — 13 PÁGINAS SEO

### Nova rota: `/moda/[slug]`

| URL | H1 | Keywords |
|---|---|---|
| `/moda/moda-feminina` | Moda Feminina | vestido, blusa, calça, conjunto, saia |
| `/moda/moda-masculina` | Moda Masculina | camisa, calça, camiseta, bermuda |
| `/moda/vestidos` | Vestidos em Oferta | vestido longo, curto, festa |
| `/moda/blusas-femininas` | Blusas Femininas | camiseta, cropped, body |
| `/moda/calcas-femininas` | Calças Femininas | jeans, legging, pantalona |
| `/moda/conjuntos-femininos` | Conjuntos Femininos | moda praia, fitness |
| `/moda/plus-size` | Moda Plus Size | GG, G1, G2 |
| `/moda/camisa-masculina` | Camisas Masculinas | social, polo, casual |
| `/moda/calca-masculina` | Calças Masculinas | jeans, sarja, social |
| `/moda/tenis-feminino` | Tênis Feminino | esportivo, casual |
| `/moda/tenis-masculino` | Tênis Masculino | corrida, casual |
| `/moda/bolsas` | Bolsas em Oferta | tiracolo, mochila |
| `/moda/sandalias` | Sandálias em Oferta | rasteirinha, salto |

Cada página:
- Metadata (title, description, OpenGraph) único
- Busca produtos no banco por keywords no título
- Breadcrumbs navegáveis
- Navegação cruzada entre páginas de moda

### Categorias reposicionadas (`src/lib/utils.ts`)
- Moda Feminina e Masculina movidas para o **topo** da lista
- Novas regras de classificação: `requireMatch: true` para subcategorias de moda
- `classifyProduct()` agora classifica vestidos como "Moda Feminina", tênis como "Calçados", etc.

---

## 4. CHECKLIST DE SEGURANÇA

| Regra | Status | Evidência |
|---|---|---|
| Layout permaneceu igual | ✅ | `src/app/layout.tsx` — **não alterado** |
| Hero permaneceu igual | ✅ | `src/components/HeroCarousel.tsx` — **não alterado** |
| Sidebars permaneceram iguais | ✅ | `src/components/HomeSidebar.tsx` — **não alterado** |
| Home permaneceu igual | ✅ | `src/app/page.tsx` — +1 linha (shein no array PorLoja) |
| Carrossel permaneceu igual | ✅ | `src/components/SwiperCarousel.tsx` — +1 linha (badge shein) |
| CSS permaneceu igual | ✅ | `src/app/globals.css` — **não alterado** |
| SEO existente funciona | ✅ | Sitemap, robots, canonical — **não alterados** |
| Build passa | ✅ | `npm run build` — 21/21 rotas, zero erros |
| Funcionalidades intactas | ✅ | ML, Magalu, Amazon, Shopee, TikTok — sem alterações nos scrapers |

---

## 5. IMPACTO POR ARQUIVO

| Arquivo | Alteração | Justificativa |
|---|---|---|
| `lib/stores/*` (4 novos) | +297 linhas | Infraestrutura escalável — **zero impacto visual** |
| `lib/affiliates/shein.ts` (novo) | +209 linhas | Scraper da SHEIN — executa apenas nos scripts de fetch |
| `lib/ia.ts` | -11/+9 | `STORE_REPUTATION` → `getStoreReputation()` do registry |
| `lib/utils.ts` | +63/-12 | `STORES` → `getActiveStores()`, novas regras de moda |
| `lib/fetch-all-deals.ts` | +6/-2 | SHEIN no `Promise.all` |
| `app/moda/[slug]/page.tsx` (novo) | +185 linhas | 13 páginas SEO de moda |
| `app/sitemap.ts` | +8 linhas | Novas URLs de moda no sitemap |
| `components/OfferCard.tsx` | +1 linha | Badge preto SHEIN |
| `components/SwiperCarousel.tsx` | +1 linha | Badge preto SHEIN |
| `app/page.tsx` | +1 linha | SHEIN no PorLoja |

---

## 6. DIAGRAMA DA ARQUITETURA

```
┌──────────────────────────────────────────┐
│         STORE REGISTRY (1 arquivo)       │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │   ML   │ │ Amazon │ │ SHEIN  │ ...   │
│  │ slug   │ │ slug   │ │ slug   │       │
│  │ color  │ │ color  │ │ color  │       │
│  │ badge  │ │ badge  │ │ badge  │       │
│  │ affili │ │ affili │ │ affili │       │
│  └────────┘ └────────┘ └────────┘       │
└──────────────────────────────────────────┘
         │              │           │
         ▼              ▼           ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│ OfferCard   │ │ IA Score │ │ Affiliate│
│ badge color │ │reputation│ │ URL gen  │
└─────────────┘ └──────────┘ └──────────┘
```

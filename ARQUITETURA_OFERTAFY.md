# 🏗️ Arquitetura Técnica — Ofertafy

> Documento gerado em 27/06/2026 — Análise completa para integração com TikTok Shop

---

## 1. Arquitetura Geral — Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAPTURA (Scrapers)                           │
│                                                                     │
│  Amazon          Mercado Livre      Shopee       Magalu     TikTok  │
│  ┌─────────┐    ┌──────────┐    ┌────────┐    ┌───────┐   ┌──────┐ │
│  │Puppeteer│    │HTTP fetch│    │GraphQL │    │HTTP   │   │REST  │ │
│  │+Stealth │    │+JSON     │    │API     │    │+NEXT  │   │API   │ │
│  │         │    │extract   │    │oficial │    │__DATA │   │      │ │
│  └────┬────┘    └────┬─────┘    └───┬────┘    └───┬───┘   └──┬───┘ │
│       │              │              │             │          │      │
└───────┼──────────────┼──────────────┼─────────────┼──────────┼──────┘
        │              │              │             │          │
        ▼              ▼              ▼             ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PROCESSAMENTO (fetcher.ts)                       │
│                                                                     │
│  fetchAllDeals()                                                    │
│  ├── Promise.all([amazon, ml, shopee, magalu, tiktok])              │
│  ├── Cada scraper retorna RawOffer[]                                │
│  ├── Para cada oferta: findFirst por (sourceId + store)             │
│  │   ├── Nova    → prisma.offer.create()                            │
│  │   └── Existe  → prisma.priceHistory.create() + offer.update()    │
│  └── Invalida cache                                                 │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS (PostgreSQL)                       │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐     │
│  │  Offer   │──│ PriceHistory │  │ SearchTerm │  │  Coupon  │     │
│  │  (5 lojas)│  │  (histórico) │  │  (busca)   │  │ (cupons) │     │
│  └──────────┘  └──────────────┘  └────────────┘  └──────────┘     │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API (Next.js Route Handlers)                     │
│                                                                     │
│  /api/offers    /api/search    /api/coupons    /api/stats           │
│  /api/fetch     /api/cron/*    /api/rss        /api/admin/*         │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js App Router)                   │
│                                                                     │
│  Home  Categorias  Busca  Produto  Lojas  Cupons  Admin             │
│  ┌──┐  ┌────────┐  ┌───┐  ┌─────┐  ┌───┐  ┌────┐  ┌─────┐        │
│  │🏠│  │📂      │  │🔍 │  │📦  │  │🏪│  │🎫 │  │ ⚙️ │        │
│  └──┘  └────────┘  └───┘  └─────┘  └───┘  └────┘  └─────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### Ciclo de vida de uma oferta

1. **Cron** dispara a cada 60 minutos (`0 * * * *`)
2. **`fetchAllDeals()`** executa os 5 scrapers em paralelo
3. Cada scraper retorna `RawOffer[]` com campos normalizados
4. Ofertas novas são inseridas; existentes com preço diferente são atualizadas
5. **Cache** é invalidado → próxima requisição reconstrói do banco
6. **Frontend** consome via API routes, com cache de 5 minutos

---

## 2. Conectores dos Marketplaces

### 2.1 Amazon

| Campo | Valor |
|---|---|
| **Arquivo** | `src/lib/affiliates/amazon.ts` |
| **Função principal** | `fetchAmazonDeals(config: AffiliateConfig): Promise<RawOffer[]>` |
| **Método** | **Headless Puppeteer + Stealth Plugin** |
| **URLs** | Goldbox deals + 6 termos de busca em Eletrônicos |
| **Afiliado** | `?tag=ofertafy00-20` na URL do produto |
| **Erros** | try/catch por URL + finally fecha browser. Falha silenciosa |

```typescript
// Exemplo do fluxo Amazon
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
for (const url of AMAZON_URLS) {
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Evade detecção
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    // Extrai produtos do DOM
    const items = await page.evaluate(() => { /* querySelectorAll */ });
    for (const item of items) {
      offers.push({
        sourceId: `amazon-${item.asin}`,
        title: item.title,
        price: item.price,
        url: `https://amazon.com.br/dp/${item.asin}?tag=${affiliateTag}`,
        store: 'amazon',
        // ... demais campos normalizados
      });
    }
  } catch (e) { /* silencioso */ }
}
await browser.close();
```

### 2.2 Mercado Livre

| Campo | Valor |
|---|---|
| **Arquivo** | `src/lib/affiliates/mercadolivre.ts` |
| **Função principal** | `fetchMercadoLivreDeals(config: AffiliateConfig): Promise<RawOffer[]>` |
| **Método** | **HTTP scraping** — `fetch()` da página `/ofertas` e extração do JSON `"items":[...]` |
| **URLs** | 2 páginas de ofertas |
| **Afiliado** | `matt_tool=35888960` na URL |
| **Erros** | try/catch por página. Fallback retorna array vazio |

```typescript
// Exemplo do fluxo ML
const response = await fetch('https://www.mercadolivre.com.br/ofertas?page=1', {
  headers: { 'User-Agent': 'Mozilla/5.0 ...' }
});
const html = await response.text();
// Encontra o bloco "items":[...] no HTML
const items = extractMLItems(html, mattTool);
// Para cada item:
offers.push({
  sourceId: `ml-${item.id}`,
  title: item.title,
  price: item.price,
  url: `${item.permalink}?matt_tool=${mattTool}`,
  store: 'mercadolivre',
  // ...
});
```

### 2.3 Shopee

| Campo | Valor |
|---|---|
| **Arquivo** | `src/lib/affiliates/shopee.ts` |
| **Função principal** | `fetchShopeeDeals(config: AffiliateConfig): Promise<RawOffer[]>` |
| **Método** | **GraphQL API oficial** (`open-api.affiliate.shopee.com.br/graphql`) |
| **Autenticação** | SHA256(appId + timestamp + payload + secret) |
| **Afiliado** | `offerLink` da API já contém tracking |
| **Erros** | Verifica `response.errors`. Retorna `[]` se credenciais ausentes. 15s timeout |

```typescript
// Exemplo do fluxo Shopee
const signature = computeSignature(appId, timestamp, payload, secret);
const response = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`
  },
  body: JSON.stringify({
    query: `query productOfferV2($keyword: String!, $page: Int!, $limit: Int!, $sortType: Int!) {
      productOfferV2(keyword: $keyword, page: $page, limit: $limit, sortType: $sortType) {
        nodes { offerLink, productName, price, imageUrl, ... }
      }
    }`,
    variables: { keyword: 'smartphone', page: 1, limit: 50, sortType: 2 }
  })
});
```

### 2.4 Magalu (Magazine Voce)

| Campo | Valor |
|---|---|
| **Arquivo** | `src/lib/affiliates/magalu.ts` |
| **Função principal** | `fetchMagaluDeals(config: AffiliateConfig): Promise<RawOffer[]>` |
| **Método** | **HTTP scraping** — `fetch()` + extração do `__NEXT_DATA__` script tag |
| **URLs** | 10 termos de busca em `magazinevoce.com.br/magazine{ofertafy}/busca/{term}` |
| **Afiliado** | URL usa o storefront `magazine{ofertafy}` |
| **Erros** | try/catch por termo. Tree-walker recursivo com max depth 8 para encontrar arrays de produtos |

```typescript
// Exemplo do fluxo Magalu
const response = await fetch(`https://www.magazinevoce.com.br/magazine${storeId}/busca/smartphone`);
const html = await response.text();
const json = extractFromNextData(html, storeId, 'smartphone');
// Tree-walker encontra arrays com objetos {title, price, id}
const products = findProductArrays(json, 0);
for (const item of products) {
  offers.push({
    sourceId: `magalu-${item.id}`,
    title: item.title,
    price: item.price.bestPrice,
    url: `https://www.magazinevoce.com.br/magazine${storeId}/${item.link}`,
    store: 'magalu',
    // ...
  });
}
```

### 2.5 TikTok Shop (parcialmente implementado)

| Campo | Valor |
|---|---|
| **Arquivo** | `src/lib/affiliates/tiktok.ts` |
| **Função principal** | `fetchTikTokDeals(config: AffiliateConfig): Promise<RawOffer[]>` |
| **Método** | **REST API oficial** (`open-api.tiktokglobalshop.com/v2/research/tts/shop/search_products`) |
| **Autenticação** | Bearer token (`TIKTOK_AFFILIATE_ID`) |
| **Status** | Código pronto, mas **sem credenciais configuradas** (retorna `[]` silenciosamente) |

---

## 3. Estrutura do Projeto (partes relacionadas a ofertas)

```
src/
├── lib/
│   ├── affiliates/              ← CONECTORES DOS MARKETPLACES
│   │   ├── amazon.ts            Puppeteer + Stealth
│   │   ├── mercadolivre.ts      HTTP scraping + JSON extraction
│   │   ├── shopee.ts            GraphQL API oficial
│   │   ├── magalu.ts            __NEXT_DATA__ scraping
│   │   ├── tiktok.ts            TikTok Shop Research API
│   │   └── coupons.ts           4 scrapers de cupons + fallback hardcoded
│   │
│   ├── fetcher.ts               ← ORQUESTRADOR CENTRAL
│   │   fetchAllDeals(), processStore(), getHomeOffers(),
│   │   searchOffers(), getOfferById(), getStats()
│   │
│   ├── cron.ts                  ← AGENDAMENTO
│   │   node-cron: hourly scraping + daily dispatch
│   │
│   ├── utils.ts                 ← UTILITÁRIOS
│   │   sanitizePrice(), classifyProduct(), calculatePromoScore(),
│   │   CATEGORIES[], STORES[], formatPrice(), slugify()
│   │
│   ├── cache.ts                 ← CACHE EM MEMÓRIA
│   │   Map-based TTL cache (5min home, 10min stats)
│   │
│   ├── prisma.ts                ← SINGLETON CLIENT
│   └── auth.ts                  ← HMAC auth para admin
│
├── services/
│   └── groupNotifier.ts         ← DISPARO DIÁRIO DE OFERTAS
│       prepareDailyOffers(), formatOfferMessage(), sendToWebhook()
│
├── scripts/
│   ├── fetch-offers.ts          ← SCRIPT MANUAL (npx tsx)
│   └── clear-and-fetch.ts       ← LIMPA E RE-FETCH
│
├── types/
│   └── index.ts                 ← OfferData, PriceHistoryData, AffiliateConfig, FetchResult
│
├── app/
│   ├── page.tsx                 Home (flash deals, top, recent)
│   ├── produto/[id]/page.tsx    Detalhe do produto + PriceChart
│   ├── categoria/[slug]/page.tsx Listagem por categoria
│   ├── loja/[store]/page.tsx    Listagem por loja
│   ├── busca/page.tsx           Busca com filtros
│   ├── ofertas-do-dia/page.tsx  Melhores ofertas do dia
│   ├── melhores-ofertas/page.tsx Ranking por desconto
│   ├── cupons/page.tsx          Listagem de cupons
│   ├── promocoes-amazon/page.tsx    Páginas específicas de loja
│   ├── promocoes-mercado-livre/page.tsx
│   ├── promocoes-shopee/page.tsx
│   ├── admin/page.tsx           Painel admin (auth)
│   └── api/
│       ├── offers/route.ts      GET (home, categoria, loja, produto)
│       ├── search/route.ts      GET (busca full-text)
│       ├── fetch/route.ts       GET (trigger scraping, protegido)
│       ├── coupons/route.ts     GET (listar + refresh)
│       ├── stats/route.ts       GET (estatísticas)
│       ├── rss/route.ts         GET (feed RSS)
│       ├── newsletter/route.ts  POST (subscribe)
│       ├── proxy-image/route.ts GET (proxy de imagem CORS)
│       └── cron/dispatch-offers/route.ts GET (disparo diário)
│
├── components/
│   ├── OfferCard.tsx            Card de oferta (imagem, preço, desconto, loja)
│   ├── OfferGrid.tsx            Grid de OfferCards
│   ├── FlashBanner.tsx          Banner de ofertas flash com contador
│   ├── FlashDeals.tsx           Seção de flash deals na home
│   ├── TopOffers.tsx            Seção de mais clicados
│   ├── PriceChart.tsx           Gráfico de histórico de preços (Recharts)
│   ├── CouponCard.tsx           Card de cupom
│   ├── SearchBar.tsx            Barra de busca com autocomplete
│   ├── CategoryFilter.tsx       Filtro lateral de categorias
│   ├── StoreFilter.tsx          Filtro por loja
│   ├── Breadcrumbs.tsx          Breadcrumb navigation
│   ├── Header.tsx               Header com busca + navegação
│   ├── Footer.tsx               Footer com links e newsletter
│   ├── NewsletterForm.tsx       Formulário de email
│   └── WhatsAppFloat.tsx        Botão flutuante do WhatsApp
│
├── instrumentation.ts           ← Entry point (registra cron jobs)
└── middleware.ts                 ← Rate limiting por IP+path

prisma/
├── schema.prisma                ← 5 modelos (Offer, PriceHistory, SearchTerm, NewsletterEmail, Coupon)
├── dev.db                       ← Banco SQLite local
├── seed.ts                      ← Seed de ofertas de exemplo
├── seed-coupons.ts              ← Seed de cupons
├── seed-shopee-catalogo.ts      ← Catálogo Shopee (celulares)
├── seed-shopee-celulares.ts     ← Catálogo Shopee (smartphones)
├── seed-ml-catalogo.ts          ← Catálogo Mercado Livre
└── seed-magalu-catalogo.ts      ← Catálogo Magalu
```

---

## 4. Banco de Dados

### 4.1 Modelo Offer (tabela principal)

```prisma
model Offer {
  id              String         @id @default(cuid())
  title           String
  description     String?
  imageUrl        String
  price           Float
  originalPrice   Float
  discountPct     Float
  currency        String         @default("BRL")
  url             String
  store           String                        // 'amazon' | 'mercadolivre' | 'shopee' | 'magalu' | 'tiktok'
  storeLabel      String                        // 'Amazon' | 'Mercado Livre' | 'Shopee' | 'Magalu' | 'TikTok Shop'
  category        String                        // 'Smartphones', 'Eletrodomésticos', etc.
  categorySlug    String                        // 'smartphones', 'eletrodomesticos'
  installment     String?                       // '12x R$ 150,00'
  freeShipping    Boolean        @default(false)
  isFlash         Boolean        @default(false)
  flashEndsAt     DateTime?
  clicks          Int            @default(0)
  likes           Int            @default(0)
  sourceId        String?                        // ID único por loja: 'amazon-B0XXXX', 'ml-123456'
  scorePromocional Int           @default(0)    // 0-200, usado para ranking
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  priceHistory    PriceHistory[]

  @@index([categorySlug])
  @@index([store])
  @@index([store, sourceId])                    // DEDUP: oferta única por loja
  @@index([price])
  @@index([createdAt])
  @@index([discountPct])
  @@index([scorePromocional])
}
```

### 4.2 Demais tabelas

```prisma
model PriceHistory {
  id        String   @id @default(cuid())
  offerId   String
  offer     Offer    @relation(fields: [offerId], references: [id])
  price     Float
  checkedAt DateTime @default(now())
  @@index([offerId, checkedAt])
}

model SearchTerm {
  id        String   @id @default(cuid())
  term      String   @unique
  count     Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model NewsletterEmail {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Coupon {
  id            String    @id @default(cuid())
  provider      String              // 'amazon', 'mercadolivre', 'magalu', 'shopee'
  code          String              // 'VALE10', 'GANHEI20'
  description   String
  discountValue String              // '10%', 'R$ 50', 'Frete Grátis'
  link          String              // URL de afiliado
  expiryDate    DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@index([provider])
  @@index([isActive])
  @@index([expiryDate])
}
```

### Relacionamentos

```
Offer ──1:N──> PriceHistory   (histórico de preços por oferta)
Offer ──N:1──> Store           (virtual, via campo `store`)
Offer ──N:1──> Category        (virtual, via campo `categorySlug`)
Coupon ──N:1──> Provider       (virtual, via campo `provider`)
```

---

## 5. Modelo de Dados (TypeScript)

```typescript
// src/types/index.ts

export interface OfferData {
  id: string
  title: string
  description: string | null
  imageUrl: string
  price: number
  originalPrice: number
  discountPct: number
  currency: string                    // 'BRL'
  url: string                         // URL com affiliate tracking
  store: string                       // 'amazon' | 'mercadolivre' | 'shopee' | 'magalu' | 'tiktok'
  storeLabel: string                  // Nome exibido
  category: string                    // Nome da categoria
  categorySlug: string                // Slug para URL
  installment: string | null          // '12x R$ 150,00'
  freeShipping: boolean
  isFlash: boolean
  flashEndsAt: Date | string | null
  clicks: number
  likes: number
  sourceId: string | null             // ID único na loja de origem
  scorePromocional: number            // 0-200
  createdAt: Date | string
  updatedAt: Date | string
  priceHistory?: PriceHistoryData[]   // Populado em detalhes do produto
}

export interface PriceHistoryData {
  id: string
  offerId: string
  price: number
  checkedAt: Date | string
}

export interface AffiliateConfig {
  mlMattTool: string                  // '35888960'
  magaluStoreId: string               // 'ofertafy'
  shopeeAppId?: string                // '18355150568'
  shopeeSecret?: string               // 'HJXHLFRX...'
  tiktokAffiliateId?: string
  tiktokAccessToken?: string
  amazonAssociateTag?: string         // 'ofertafy00-20'
  amazonAccessKey?: string
  amazonSecretKey?: string
}

export interface FetchResult {
  store: string
  offersFound: number
  offersAdded: number
  offersUpdated: number
  errors: string[]
}

export interface SearchResponse {
  offers: OfferData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Interface interna usada pelos scrapers (antes da persistência)
interface RawOffer {
  sourceId: string
  title: string
  description: string | null
  imageUrl: string
  price: number
  originalPrice: number
  discountPct: number
  url: string
  store: string
  storeLabel: string
  category: string
  categorySlug: string
  installment: string | null
  freeShipping: boolean
  isFlash: boolean
  flashEndsAt: string | null
  scorePromocional: number
}
```

---

## 6. Processo de Atualização

### 6.1 Cron Jobs

```typescript
// src/lib/cron.ts
import cron from 'node-cron';

let cronStarted = false;

export function startCronJobs() {
  if (cronStarted) return;
  cronStarted = true;

  // Scraping: toda hora em ponto
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Iniciando fetch de ofertas...');
    const results = await fetchAllDeals();
    const total = results.reduce((s, r) => s + r.offersFound, 0);
    console.log(`[CRON] ${total} ofertas processadas`);
  });

  // Disparo diário: 10h, 14h, 18h
  cron.schedule('0 10,14,18 * * *', async () => {
    console.log('[CRON] Disparando ofertas do dia...');
    const result = await dispatchDailyOffers();
    console.log(`[CRON] Disparo: ${result.status}`);
  });
}
```

### 6.2 Inicialização

```typescript
// src/instrumentation.ts — executado pelo Next.js na inicialização
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCronJobs } = await import('./lib/cron');
    startCronJobs();
  }
}
```

### 6.3 Gatilhos manuais

```bash
npm run fetch              # Script standalone
curl /api/fetch?secret=xxx # Endpoint web (protegido)
```

### 6.4 Resumo

| Mecanismo | Frequência | O que faz |
|---|---|---|
| **Cron (scraping)** | A cada 60 min (`0 * * * *`) | `fetchAllDeals()` → 5 scrapers em paralelo |
| **Cron (disparo)** | 10h, 14h, 18h | `dispatchDailyOffers()` → 3 melhores → webhook |
| **Manual** | Sob demanda | `npm run fetch` ou endpoint `/api/fetch` |
| **Cache** | 5 min (home), 10 min (stats) | Invalida após scraping |

---

## 7. Sistema de Afiliados

### 7.1 Onde o tracking é injetado

| Loja | Arquivo | Função | Como |
|---|---|---|---|
| **Amazon** | `amazon.ts:buildOffer()` | `url = https://amazon.com.br/dp/${asin}?tag=${affiliateTag}` | `?tag=ofertafy00-20` |
| **Mercado Livre** | `mercadolivre.ts:parseItem()` | `url = ${permalink}?matt_tool=${mattTool}` | `?matt_tool=35888960` |
| **Shopee** | `shopee.ts:buildOffer()` | `url = node.offerLink` | API já retorna link com tracking |
| **Magalu** | `magalu.ts:buildMagaluVoceOffer()` | `url = https://www.magazinevoce.com.br/magazine${storeId}/...` | Storefront Magazine Voce |
| **TikTok** | `tiktok.ts:buildAffiliateUrl()` | `url = ...?u_code=${affiliateId}&utm_source=copy&...` | `?u_code=eif04je11e51h7` |

### 7.2 Configuração centralizada

```typescript
// src/lib/utils.ts
export function generateAffiliateUrl(productUrl: string, store: string, config: AffiliateConfig): string {
  switch (store) {
    case 'mercadolivre': return buildMercadoLivreLink(productUrl);
    case 'magalu':       return buildMagaluLink(productUrl, config.magaluStoreId);
    case 'amazon':       return `${productUrl}?tag=${config.amazonAssociateTag || 'ofertafy00-20'}`;
    case 'shopee':       return productUrl; // API já retorna link pronto
    case 'tiktok':       return buildAffiliateUrl(productUrl, config.tiktokAffiliateId || 'eif04je11e51h7');
    default:             return productUrl;
  }
}
```

---

## 8. Normalização

### 8.1 Pipeline de normalização

```
Scraper → RawOffer → processStore() → Prisma (Offer)
```

Cada scraper produz `RawOffer` com o mesmo formato. A normalização acontece em 3 camadas:

### Camada 1 — Dentro do scraper

```typescript
// Exemplo: mercadolivre.ts → parseItem()
price: 1899.00,                    // número (não string)
originalPrice: 2499.00,            // calculado se ausente (price * 1.35)
discountPct: 24.01,                // (1 - price/original) * 100
sourceId: 'ml-123456789',          // prefixo único por loja
imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_123456789-F.webp',
installment: '12x R$ 158,25',      // formatado
freeShipping: true,
isFlash: false,
scorePromocional: 145,             // calculatePromoScore()
category: 'Smartphones',           // classifyProduct()
categorySlug: 'smartphones',       // slugify()
store: 'mercadolivre',
storeLabel: 'Mercado Livre',
```

### Camada 2 — `sanitizePrice()` (preços de string → float)

```typescript
// src/lib/utils.ts
export function sanitizePrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0;
  // 'R$ 1.899,00' → 1899.00
  // '49,90' → 49.90
  // '2.399' → 2399.00 (formato milhar sem centavos)
  let cleaned = priceStr.replace(/[R$\s]/g, '');
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
```

### Camada 3 — `classifyProduct()` (categorização inteligente)

```typescript
// src/lib/utils.ts
export function classifyProduct(title: string, price: number, originalCategory?: string): string {
  const categories = [
    { name: 'Smartphones', keywords: ['smartphone', 'celular', 'iphone', 'samsung', 'motorola'] },
    { name: 'Notebooks', keywords: ['notebook', 'laptop', 'macbook', 'chromebook'] },
    { name: 'TVs', keywords: ['tv', 'televisão', 'smart tv', 'televisor'] },
    { name: 'Eletrodomésticos', keywords: ['geladeira', 'fogão', 'microondas', 'máquina', 'aspirador'] },
    { name: 'Eletrônicos', keywords: ['fone', 'caixa', 'soundbar', 'tablet', 'kindle'] },
    { name: 'Moda', keywords: ['tenis', 'camiseta', 'calça', 'vestido', 'mochila'] },
    { name: 'Beleza', keywords: ['perfume', 'creme', 'maquiagem', 'shampoo'] },
    { name: 'Casa', keywords: ['cama', 'mesa', 'banho', 'sofá', 'colchão'] },
    { name: 'Esportes', keywords: ['bicicleta', 'peso', 'halteres', 'esteira'] },
    { name: 'Brinquedos', keywords: ['boneco', 'boneca', 'lego', 'nerf'] },
  ];
  // Regra especial: smartphone barato + palavra de acessório → Acessórios
  if (price < 200 && /capa|cabo|película|fone/.test(title.toLowerCase())) {
    return 'Acessórios para Celular';
  }
  // Match por keyword
  for (const cat of categories) {
    if (cat.keywords.some(kw => title.toLowerCase().includes(kw))) {
      return cat.name;
    }
  }
  return originalCategory || 'Ofertas';
}
```

---

## 9. Busca

### 9.1 Implementação

```typescript
// src/lib/fetcher.ts
export async function searchOffers(
  query: string,
  filters: { store?: string; category?: string; minPrice?: number; maxPrice?: number; minDiscount?: number; freeShipping?: boolean },
  page = 1,
  pageSize = 24
): Promise<SearchResponse> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  // WHERE dinâmico
  const where: Prisma.OfferWhereInput = {};

  // Busca multi-palavra com AND
  if (terms.length > 0) {
    where.AND = terms.map(term => ({
      title: { contains: term, mode: 'insensitive' }
    }));
  }

  if (filters.store)          where.store = filters.store;
  if (filters.category)       where.categorySlug = filters.category;
  if (filters.minPrice)       where.price = { ...where.price as any, gte: filters.minPrice };
  if (filters.maxPrice)       where.price = { ...where.price as any, lte: filters.maxPrice };
  if (filters.minDiscount)    where.discountPct = { gte: filters.minDiscount };
  if (filters.freeShipping)   where.freeShipping = true;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({ where, orderBy: { scorePromocional: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.offer.count({ where })
  ]);

  return { offers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
```

### 9.2 Fluxo da busca

```
Usuário digita "iphone 15"
  → /api/search?q=iphone+15
    → searchOffers("iphone 15", filters)
      → Prisma: WHERE title ILIKE '%iphone%' AND title ILIKE '%15%'
        → ORDER BY scorePromocional DESC
          → LIMIT 24 OFFSET 0
            → Retorna OfferData[] + total
```

---

## 10. SEO

### 10.1 Páginas de categoria (`/categoria/[slug]`)

```typescript
// Gera metadata dinâmica
export async function generateMetadata({ params }: Props) {
  const categoria = CATEGORIES.find(c => c.slug === params.slug);
  return {
    title: `${categoria.name} em Oferta — Menor Preço | Ofertafy`,
    description: `As melhores ofertas de ${categoria.name} com até 80% OFF. Compare preços, frete grátis e cupons.`,
    openGraph: { title: `Ofertas de ${categoria.name}`, images: ['/og-image.png'] },
  };
}
```

### 10.2 Páginas de produto (`/produto/[id]`)

```typescript
export async function generateMetadata({ params }: Props) {
  const offer = await getOfferById(params.id);
  return {
    title: `${offer.title} — R$ ${offer.price} na ${offer.storeLabel} | Ofertafy`,
    description: `${offer.title} por apenas R$ ${offer.price}. ${offer.discountPct}% OFF. ${offer.freeShipping ? 'Frete Grátis!' : ''}`,
  };
}
```

### 10.3 Sitemap

```typescript
// src/app/sitemap.ts
export default async function sitemap() {
  const offers = await prisma.offer.findMany({ select: { id: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 5000 });
  const categories = CATEGORIES.map(c => ({ slug: c.slug }));

  return [
    { url: 'https://ofertafy.com.br', priority: 1.0 },
    { url: 'https://ofertafy.com.br/melhores-ofertas', priority: 0.8 },
    ...categories.map(c => ({ url: `https://ofertafy.com.br/categoria/${c.slug}`, priority: 0.7 })),
    ...offers.map(o => ({ url: `https://ofertafy.com.br/produto/${o.id}`, lastModified: o.updatedAt, priority: 0.6 })),
  ];
}
```

### 10.4 URLs

```
/                                         Home
/categoria/smartphones                    Categoria
/produto/cm3k4x5yz0001abc                Produto (cuid)
/loja/mercadolivre                       Loja
/busca?q=iphone+15                       Busca
/promocoes-amazon                        Landing page por loja
/ofertas-do-dia                          Flash deals
/melhores-ofertas                        Ranking
/cupons                                  Cupons
```

---

## 11. Escalabilidade

### 11.1 O que já está preparado para novo marketplace

| Componente | Status | Observação |
|---|---|---|
| **Interface RawOffer** | ✅ | Padronizada — todo scraper retorna o mesmo formato |
| **AffiliateConfig** | ✅ | Campos opcionais por loja — novo campo não quebra existentes |
| **processStore()** | ✅ | Genérico — aceita qualquer `RawOffer[]` + nome da loja |
| **STORES[]** | ✅ | Array estático — adicionar entrada ativa a nova loja |
| **CATEGORIES[]** | ✅ | Categorização por keyword — cobre a maioria dos produtos |
| **Prisma schema** | ✅ | Campo `store` é string livre — sem enum rígido |
| **OfferCard** | ✅ | Badge de loja por cor — adicionar entrada no mapa de cores |
| **Páginas de loja** | ✅ | `/loja/[store]` e `/promocoes-{store}` dinâmicas |
| **Cache invalidation** | ✅ | Pattern-based — novo store automaticamente cacheado |

### 11.2 O que precisa ser alterado para nova loja

| Componente | O que fazer |
|---|---|
| `src/lib/affiliates/` | **Criar** novo arquivo `{loja}.ts` com `fetch{Loja}Deals()` |
| `src/lib/fetcher.ts` | **Adicionar** chamada ao novo scraper no `Promise.all()` de `fetchAllDeals()` |
| `src/lib/utils.ts` | **Adicionar** entrada em `STORES[]` e tratamento de URL em `generateAffiliateUrl()` |
| `src/types/index.ts` | Nenhuma alteração necessária (tipos são genéricos) |
| `src/components/OfferCard.tsx` | **Adicionar** cor e label da nova loja no mapa de badges |
| `prisma/schema.prisma` | Nenhuma alteração (store é string) |
| `.env` / `.env.example` | **Adicionar** credenciais da nova loja |
| `src/app/promocoes-{loja}/` | **Criar** página específica da loja (segue padrão existente) |

---

## 12. Proposta de Integração — TikTok Shop

### 12.1 Diagnóstico atual

O arquivo `src/lib/affiliates/tiktok.ts` **já existe** com:
- Função `fetchTikTokDeals()` completa
- Chamada à API oficial `open-api.tiktokglobalshop.com`
- Busca por 8 termos, página de 20 itens, ordenado por vendas
- Construção de URL com `u_code` de afiliado
- Tratamento de erros (401/403 silencioso)

**Porém**, as credenciais não estão configuradas:
- `TIKTOK_AFFILIATE_ID` vazio
- `TIKTOK_ACCESS_TOKEN` vazio
- O scraper retorna `[]` silenciosamente

E o TikTok **não está integrado** ao orquestrador:
- `src/lib/fetcher.ts:fetchAllDeals()` **não chama** `fetchTikTokDeals()`
- `STORES[]` não inclui entrada para TikTok

### 12.2 O que falta implementar

#### Passo 1 — Adicionar ao orquestrador

**Arquivo:** `src/lib/fetcher.ts`

```typescript
// Dentro de fetchAllDeals(), adicionar ao Promise.all:
const [amazonDeals, mlDeals, shopeeDeals, magaluDeals, tiktokDeals] = await Promise.all([
  fetchAmazonDeals(config),
  fetchMercadoLivreDeals(config),
  fetchShopeeDeals(config),
  fetchMagaluDeals(config),
  fetchTikTokDeals(config),  // ← ADICIONAR
]);

// Depois, processar as ofertas:
if (tiktokDeals.length > 0) {
  const result = await processStore(tiktokDeals, 'tiktok');
  results.push(result);
}
```

#### Passo 2 — Adicionar entrada em STORES[]

**Arquivo:** `src/lib/utils.ts`

```typescript
{ slug: 'tiktok', label: 'TikTok Shop', color: '#000000', active: true }
```

#### Passo 3 — Configurar credenciais

**Arquivo:** `.env`

```env
TIKTOK_AFFILIATE_ID=eif04je11e51h7
TIKTOK_ACCESS_TOKEN=xxx
```

#### Passo 4 — Badge no OfferCard

**Arquivo:** `src/components/OfferCard.tsx`

```typescript
const storeColors: Record<string, string> = {
  // ... existentes
  tiktok: 'bg-black text-white',
};
```

#### Passo 5 — Criar página promocional

**Arquivo:** `src/app/promocoes-tiktok/page.tsx` (seguir padrão de `promocoes-shopee`)

#### Passo 6 — Adicionar ao rastreador de afiliados

**Arquivo:** `src/lib/utils.ts → generateAffiliateUrl()`

```typescript
case 'tiktok':
  return buildAffiliateUrl(productUrl, config.tiktokAffiliateId || 'eif04je11e51h7');
```

### 12.3 Resumo da integração

| O que | Onde | Tipo |
|---|---|---|
| Scraper TikTok | `src/lib/affiliates/tiktok.ts` | ✅ Já existe |
| Orquestrador | `src/lib/fetcher.ts:fetchAllDeals()` | ❌ Adicionar chamada |
| Lista de lojas | `src/lib/utils.ts:STORES[]` | ❌ Adicionar entrada |
| Credenciais | `.env` | ❌ Configurar |
| Badge visual | `src/components/OfferCard.tsx` | ❌ Adicionar cor |
| Página promocional | `src/app/promocoes-tiktok/page.tsx` | ❌ Criar |
| URL afiliado | `src/lib/utils.ts:generateAffiliateUrl()` | ❌ Adicionar case |
| Schema Prisma | (nenhum) | ✅ Store é string |
| Cache | (nenhum) | ✅ Automático |
| Cron | (nenhum) | ✅ Já roda `fetchAllDeals()` |

**Total: 6 arquivos para alterar, 1 para criar, 0 para refatorar.**

---

> **Conclusão:** A arquitetura do Ofertafy está bem preparada para expansão. O padrão de conectores é consistente, a normalização é centralizada, e a adição de um novo marketplace requer apenas configurar o scraper (que já existe para o TikTok), integrá-lo ao orquestrador, e adicionar as entradas de configuração visual. Nenhuma refatoração estrutural é necessária.

/**
 * OfertaFy — Product Seed / Ingestion Runner
 *
 * THIS is where products enter the pipeline.
 *
 * Flow per product:
 *   1. parseProductUrl(url)     → extract store, shopId, productId
 *   2. getOfferKey(store, url)  → generate stable unique key
 *   3. isDuplicate(key)         → dedup check (O(1))
 *   4. ingestOffer({...})       → upsert into OFFERS array
 *   5. affiliate.ts             → downstream link enrichment (UTMs preserved)
 *   6. /api/convert-link        → server-side affiliate conversion on click
 *
 * NEVER add products directly to featured-offers.tsx.
 * ALWAYS add them here via ingestOffer().
 */

import {
  parseProductUrl,
  ingestOffer,
  urlExists,
  previewOfferKey,
  getStoreOffers,
} from "./ingest";
import { getOfferKey, isDuplicate, findOfferByKey } from "./offers";

// ---------------------------------------------------------------------------
// Product: Shopee — Item 58212391133 (Shop KODI, ID 1386771889)
// ---------------------------------------------------------------------------
// Source URL: https://shopee.com.br/product/1386771889/58212391133
// Shop:       KODI (loja oficial Shopee, 4.78★, 117 produtos, ~16K seguidores)
// Product ID: 58212391133
// Shop ID:    1386771889
// ---------------------------------------------------------------------------

const SHOPEE_PRODUCT_URL = "https://shopee.com.br/product/1386771889/58212391133";

// Step 1: Parse the URL to extract structured data
const parsed = parseProductUrl(SHOPEE_PRODUCT_URL);

if (!parsed) {
  throw new Error(`Falha ao parsear URL: ${SHOPEE_PRODUCT_URL}`);
}

console.log("[seed] parseProductUrl:", JSON.stringify(parsed, null, 2));
// → { store: "Shopee", productId: "58212391133", shopId: "1386771889", originalUrl: "..." }

// Step 2: Generate stable offer key
const offerKey = previewOfferKey(SHOPEE_PRODUCT_URL);
console.log("[seed] getOfferKey:", offerKey);
// → "shopee:1386771889:58212391133"

// Step 3: Dedup check before inserting
if (urlExists(SHOPEE_PRODUCT_URL)) {
  console.log("[seed] ⚠️ Produto já existe no pipeline. Atualizando dados...");
  const existing = findOfferByKey(offerKey!);
  if (existing) {
    console.log("[seed] Existing offer:", existing.name, "|", existing.currentPrice);
  }
}

// Step 4: Ingest via pipeline (upsertOffer is called internally by ingestOffer)
const result = ingestOffer({
  url: SHOPEE_PRODUCT_URL,
  name: "Produto KODI — Shopee Oficial",
  originalPrice: "R$ 199,90",
  currentPrice: "R$ 99,90",
  discount: "50% OFF",
  category: "Acessórios",
  img: "🛍️",
  hotDegree: "42° Hot",
  aiTrust: "9.6",
  likes: 0,
});

console.log("[seed] ingestOffer result:");
console.log("  - isNew:     ", result.isNew);
console.log("  - offerKey:  ", result.offerKey);
console.log("  - id:        ", result.offer.id);
console.log("  - store:     ", result.offer.source);
console.log("  - productId: ", result.offer.productId);
console.log("  - url:       ", result.offer.url);

// Step 5: Verify the product is now in the Shopee store listing
const shopeeOffers = getStoreOffers("Shopee");
console.log("[seed] Total Shopee offers in pipeline:", shopeeOffers.length);
console.log("[seed] Shopee offers:", shopeeOffers.map((o) => `${o.name} [${getOfferKey(o.source, o.url)}]`));

// Step 6: Affiliate link flow (runs at runtime in the browser)
//   affiliate.ts        → generateAffiliateLink(url, "shopee")
//   /api/convert-link   → server-side link conversion
//   The UTMs (utm_campaign, utm_medium, utm_source) are PRESERVED
//   and ENRICHED — never stripped.
console.log("[seed] ✅ Pipeline completo — affiliate link será gerado via affiliate.ts no client.");

export { result as shopeeKodiProduct };

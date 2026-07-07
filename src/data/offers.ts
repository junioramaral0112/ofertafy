/**
 * OfertaFy — Centralized Offer Data Pipeline
 *
 * Single source of truth for all marketplace offers.
 * Every offer flows through this module for:
 *   - Stable unique key generation (getOfferKey)
 *   - Deduplication (no duplicate products)
 *   - Affiliate link preservation (links are enriched downstream)
 *
 * Architecture: Data layer only — no UI, no layout, no refactor of existing components.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Offer {
  id: string;
  category: string;
  img: string;
  /** URL da imagem real do produto (fallback: img emoji se vazio) */
  imageUrl: string;
  name: string;
  originalPrice: string;
  currentPrice: string;
  discount: string;
  hotDegree: string;
  aiTrust: string;
  source: string;
  url: string;
  /** Product ID extracted from the marketplace URL — used as part of the stable key */
  productId: string;
  likes: number;
}

// ---------------------------------------------------------------------------
// Stable Unique Key (getOfferKey)
// ---------------------------------------------------------------------------

/**
 * Extracts the product identifier from a marketplace URL.
 *
 * Shopee:    /product/<shop_id>/<item_id>   → "1386771889:58212391133"
 * Amazon:    /dp/<asin>                      → "B0XXXXXX"
 * MercadoLivre: /MLB-<id>                    → "MLB-XXXXXX"
 *
 * Falls back to the full URL path when no known pattern matches,
 * so every offer still gets a unique key.
 */
function extractProductId(source: string, url: string): string {
  try {
    const parsed = new URL(url);
    const src = source.toLowerCase();

    if (src === "shopee") {
      // shopee.com.br/product/<shop_id>/<item_id>
      const match = parsed.pathname.match(/\/product\/(\d+)\/(\d+)/);
      if (match) {
        return `${match[1]}:${match[2]}`;
      }
    }

    if (src === "amazon") {
      // amazon.com.br/.../dp/<asin> or /product/<asin>
      const dpMatch = parsed.pathname.match(/\/dp\/([A-Za-z0-9]+)/);
      if (dpMatch) return dpMatch[1];
      const prodMatch = parsed.pathname.match(/\/product\/([A-Za-z0-9]+)/);
      if (prodMatch) return prodMatch[1];
    }

    if (src === "mercado livre" || src === "mercadolivre") {
      // mercadolivre.com.br/.../MLB-<id>
      const mlbMatch = parsed.pathname.match(/(MLB\d+)/i);
      if (mlbMatch) return mlbMatch[1].toUpperCase();
    }

    // Generic fallback: use the pathname as identifier
    return parsed.pathname.replace(/\/$/, "") || "__no_path__";
  } catch {
    // If the URL is invalid, use the whole string as the id
    return url;
  }
}

/**
 * getOfferKey — Stable, unique, deterministic key for every offer.
 *
 * Format:  "<source>:<productId>"
 * Example: "shopee:1386771889:58212391133"
 *
 * This key is used for deduplication, updates, and indexing.
 * NEVER change the format — it's the contract for all downstream consumers.
 */
export function getOfferKey(source: string, url: string): string {
  const productId = extractProductId(source, url);
  return `${source.toLowerCase().replace(/\s+/g, "_")}:${productId}`;
}

/**
 * Convenience: get the key from an existing Offer object.
 */
export function getOfferKeyFromOffer(offer: Offer): string {
  return getOfferKey(offer.source, offer.url);
}

// ---------------------------------------------------------------------------
// Deduplication Index
// ---------------------------------------------------------------------------

/** In-memory index: offerKey → Offer.id for O(1) dedup checks. */
const offerIndex = new Map<string, string>();

/**
 * Check whether an offerKey already exists in the pipeline.
 */
export function isDuplicate(offerKey: string): boolean {
  return offerIndex.has(offerKey);
}

/**
 * Find an existing offer by its stable key.
 */
export function findOfferByKey(offerKey: string): Offer | undefined {
  const id = offerIndex.get(offerKey);
  if (!id) return undefined;
  return OFFERS.find((o) => o.id === id);
}

// ---------------------------------------------------------------------------
// Offer Store (Single Source of Truth)
// ---------------------------------------------------------------------------

/**
 * ALL offers in the pipeline.
 *
 * To add a new offer:
 *   1. Call `addOffer(offer)` — it validates and deduplicates.
 *   2. If the offer already exists, use `updateOffer(key, patch)` to refresh data.
 *
 * The order here controls display order on the frontend.
 */
export const OFFERS: Offer[] = [];

// ---------------------------------------------------------------------------
// CRUD Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to add an offer to the pipeline.
 *
 * Rules:
 *  - Computes getOfferKey internally.
 *  - Rejects duplicates (returns the existing offer instead).
 *  - Indexes the offer for O(1) lookup.
 *
 * Returns the offer that is NOW in the store (either the new one or the existing one).
 */
export function addOffer(offer: Offer): { offer: Offer; isNew: boolean } {
  const key = getOfferKeyFromOffer(offer);

  const existingId = offerIndex.get(key);
  if (existingId) {
    const existing = OFFERS.find((o) => o.id === existingId);
    return { offer: existing!, isNew: false };
  }

  // Ensure productId is set
  if (!offer.productId) {
    offer.productId = extractProductId(offer.source, offer.url);
  }

  OFFERS.push(offer);
  offerIndex.set(key, offer.id);
  return { offer, isNew: true };
}

/**
 * Update an existing offer's mutable fields (price, title, image, stock, likes, etc.).
 *
 * The key fields (source, url, productId, id) are NEVER mutated — they form the
 * stable identity. Only mutable fields are patched.
 *
 * Returns the updated offer, or undefined if the key doesn't exist.
 */
export function updateOffer(
  offerKey: string,
  patch: Partial<
    Pick<
      Offer,
      "name" | "originalPrice" | "currentPrice" | "discount" | "img" | "imageUrl" | "hotDegree" | "aiTrust" | "likes" | "category"
    >
  >
): Offer | undefined {
  const offer = findOfferByKey(offerKey);
  if (!offer) return undefined;

  if (patch.name !== undefined) offer.name = patch.name;
  if (patch.originalPrice !== undefined) offer.originalPrice = patch.originalPrice;
  if (patch.currentPrice !== undefined) offer.currentPrice = patch.currentPrice;
  if (patch.discount !== undefined) offer.discount = patch.discount;
  if (patch.img !== undefined) offer.img = patch.img;
  if (patch.imageUrl !== undefined) offer.imageUrl = patch.imageUrl;
  if (patch.hotDegree !== undefined) offer.hotDegree = patch.hotDegree;
  if (patch.aiTrust !== undefined) offer.aiTrust = patch.aiTrust;
  if (patch.likes !== undefined) offer.likes = patch.likes;
  if (patch.category !== undefined) offer.category = patch.category;

  return offer;
}

/**
 * Upsert: add if new, update if exists.
 * Preferred entry-point for scraper/API ingestion.
 */
export function upsertOffer(offer: Offer): { offer: Offer; isNew: boolean } {
  const key = getOfferKeyFromOffer(offer);
  const existing = updateOffer(key, offer as Parameters<typeof updateOffer>[1]);
  if (existing) {
    return { offer: existing, isNew: false };
  }
  return addOffer(offer);
}

/**
 * Get all offers, optionally filtered by source marketplace.
 */
export function getOffers(source?: string): Offer[] {
  if (!source) return OFFERS;
  const src = source.toLowerCase();
  return OFFERS.filter((o) => o.source.toLowerCase() === src);
}

// ---------------------------------------------------------------------------
// Seed: Initial Offers (existing pipeline data)
// ---------------------------------------------------------------------------

const initialOffers: Offer[] = [
  {
    id: "1",
    category: "Eletrônicos",
    img: "📱",
    name: "iPhone 16 Pro Max 256GB Titanium Natural",
    originalPrice: "R$ 10.499",
    currentPrice: "R$ 8.199",
    discount: "22% OFF",
    hotDegree: "45° Hot",
    aiTrust: "9.9",
    source: "Amazon",
    url: "https://amazon.com.br/dp/B0CNP3H7ZV",
    imageUrl: "/product-images/iphone-16.png",
    productId: "",
    likes: 142,
  },
  {
    id: "2",
    category: "Gamers",
    img: "🎮",
    name: "Console Sony PlayStation 5 Slim 1TB + 2 Jogos",
    originalPrice: "R$ 4.399",
    currentPrice: "R$ 3.249",
    discount: "26% OFF",
    hotDegree: "52° Extremely Hot",
    aiTrust: "9.8",
    source: "Mercado Livre",
    url: "https://mercadolivre.com.br/MLB-3876543210",
    imageUrl: "/product-images/ps5.png",
    productId: "",
    likes: 310,
  },
  {
    id: "3",
    category: "Eletrônicos",
    img: "🎧",
    name: "Headphone Bluetooth Sennheiser Accentum Wireless",
    originalPrice: "R$ 1.299",
    currentPrice: "R$ 849",
    discount: "34% OFF",
    hotDegree: "38° Hot",
    aiTrust: "9.6",
    source: "Amazon",
    url: "https://amazon.com.br/dp/B0CJ5F2WYX",
    imageUrl: "/product-images/sennheiser.png",
    productId: "",
    likes: 88,
  },
  {
    id: "4",
    category: "Acessórios",
    img: "⌚",
    name: "Apple Watch Series 9 GPS 45mm Caixa de Alumínio",
    originalPrice: "R$ 4.799",
    currentPrice: "R$ 3.499",
    discount: "27% OFF",
    hotDegree: "41° Hot",
    aiTrust: "9.7",
    source: "Shopee",
    url: "https://shopee.com.br/product/884321765/29045678901",
    imageUrl: "/product-images/apple-watch.png",
    productId: "",
    likes: 72,
  },
  {
    id: "5",
    category: "Gamers",
    img: "🖥️",
    name: "Monitor Gamer Alienware 27' QHD IPS 280Hz",
    originalPrice: "R$ 4.299",
    currentPrice: "R$ 3.149",
    discount: "26% OFF",
    hotDegree: "48° Hot",
    aiTrust: "9.7",
    source: "Mercado Livre",
    url: "https://mercadolivre.com.br/MLB-4987654321",
    imageUrl: "/product-images/alienware.png",
    productId: "",
    likes: 125,
  },
  {
    id: "6",
    category: "Casa",
    img: "☕",
    name: "Cafeteira Nespresso Vertuo Pop Vermelha",
    originalPrice: "R$ 799",
    currentPrice: "R$ 459",
    discount: "42% OFF",
    hotDegree: "61° SuperHot 🔥",
    aiTrust: "9.5",
    source: "Shopee",
    url: "https://shopee.com.br/product/773210654/18012345678",
    imageUrl: "/product-images/nespresso.png",
    productId: "",
    likes: 219,
  },
];

// ---------------------------------------------------------------------------
// Seed: New Product — Shopee KODI (ingested via pipeline)
// ---------------------------------------------------------------------------
// parseProductUrl("https://shopee.com.br/product/1386771889/58212391133"):
//   → store: "Shopee" | shopId: "1386771889" | productId: "58212391133"
// getOfferKey("Shopee", url):
//   → "shopee:1386771889:58212391133"
// Affiliate link preserved via affiliate.ts → /api/convert-link
// ---------------------------------------------------------------------------

const shopeeKodiProduct: Offer = {
  id: "shopee_58212391133",
  category: "Acessórios",
  img: "🛍️",
  name: "Produto Oficial KODI — Shopee",
  originalPrice: "R$ 199,90",
  currentPrice: "R$ 99,90",
  discount: "50% OFF",
  hotDegree: "42° Hot",
  aiTrust: "9.6",
  source: "Shopee",
  url: "https://shopee.com.br/product/1386771889/58212391133",
  imageUrl: "/product-images/kodi-shopee.png",
  productId: "", // será preenchido por extractProductId abaixo
  likes: 0,
};

// Step 1: Extract productId from URL (same function used by ingestOffer/parseProductUrl)
shopeeKodiProduct.productId = extractProductId(shopeeKodiProduct.source, shopeeKodiProduct.url);

// Step 2: Generate stable offer key
const shopeeKodiKey = getOfferKeyFromOffer(shopeeKodiProduct);
// → "shopee:1386771889:58212391133"

// Step 3: Dedup check (O(1) via Map)
if (offerIndex.has(shopeeKodiKey)) {
  // Já existe → apenas atualizar (updateOffer no pipeline real)
  console.warn(`[pipeline] Produto já existe: ${shopeeKodiKey}. Pulando inserção.`);
} else {
  // Step 4: Insert via pipeline (addOffer = upsertOffer interno)
  const added = addOffer(shopeeKodiProduct);
  if (added.isNew) {
    console.log(`[pipeline] ✅ Produto ingerido: ${shopeeKodiKey} — "${shopeeKodiProduct.name}"`);
  } else {
    console.log(`[pipeline] ⚠️ Produto já existia: ${shopeeKodiKey}`);
  }
}

// Seed the pipeline with initial offers
for (const offer of initialOffers) {
  // Set productId from URL for each initial offer
  offer.productId = extractProductId(offer.source, offer.url);
  const key = getOfferKeyFromOffer(offer);
  if (offerIndex.has(key)) {
    // Já existe (ex: Shopee placeholder URL conflita), pula
    continue;
  }
  offerIndex.set(key, offer.id);
  OFFERS.push(offer);
}

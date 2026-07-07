/**
 * OfertaFy — Product Ingestion Module (Scraper → Pipeline Bridge)
 *
 * This module is the ENTRY POINT for new offers into the pipeline.
 *
 * Flow:
 *   1. Raw URL received (from scraper, manual input, API, webhook)
 *   2. URL parsed → productId, shopId, store extracted
 *   3. offerKey generated via getOfferKey(store, url)
 *   4. Dedup check → upsertOffer() called
 *   5. Affiliate link enrichment handled downstream by affiliate.ts + /api/convert-link
 *
 * Architecture: Ingestion → Pipeline (offers.ts) → Affiliate (affiliate.ts) → Frontend
 *
 * NEVER insert products directly into React components.
 * ALWAYS use ingestOffer() or ingestOfferFromUrl().
 */

import {
  Offer,
  getOfferKey,
  getOfferKeyFromOffer,
  upsertOffer,
  findOfferByKey,
  isDuplicate,
  getOffers,
} from "./offers";

// ---------------------------------------------------------------------------
// URL Parsing — Extract structured data from marketplace URLs
// ---------------------------------------------------------------------------

export interface ParsedProductUrl {
  store: string;
  productId: string;
  shopId: string | null;
  originalUrl: string;
}

/**
 * Parse a marketplace URL into its structured components.
 *
 * Supported patterns:
 *   Shopee:       /product/<shop_id>/<item_id>
 *   Amazon:        /dp/<asin>  |  /product/<asin>
 *   Mercado Livre: /.../MLB-<id>
 */
export function parseProductUrl(url: string): ParsedProductUrl | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // --- Shopee ---
    if (hostname.includes("shopee.com.br") || hostname.includes("shopee.io")) {
      const match = parsed.pathname.match(/\/product\/(\d+)\/(\d+)/);
      if (match) {
        return {
          store: "Shopee",
          productId: match[2], // item_id
          shopId: match[1],    // shop_id
          originalUrl: url,
        };
      }
      // Shopee short link: https://shope.ee/<code>
      return {
        store: "Shopee",
        productId: parsed.pathname.replace(/\//g, ""),
        shopId: null,
        originalUrl: url,
      };
    }

    // --- Amazon ---
    if (hostname.includes("amazon.com.br") || hostname.includes("amazon.com")) {
      const dpMatch = parsed.pathname.match(/\/dp\/([A-Za-z0-9]+)/);
      if (dpMatch) {
        return {
          store: "Amazon",
          productId: dpMatch[1],
          shopId: null,
          originalUrl: url,
        };
      }
      const prodMatch = parsed.pathname.match(/\/product\/([A-Za-z0-9]+)/);
      if (prodMatch) {
        return {
          store: "Amazon",
          productId: prodMatch[1],
          shopId: null,
          originalUrl: url,
        };
      }
    }

    // --- Mercado Livre ---
    if (hostname.includes("mercadolivre.com.br") || hostname.includes("mercadolibre.com")) {
      const mlbMatch = parsed.pathname.match(/(MLB\d+)/i);
      if (mlbMatch) {
        return {
          store: "Mercado Livre",
          productId: mlbMatch[1].toUpperCase(),
          shopId: null,
          originalUrl: url,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Offer Ingestion Input (what the scraper/API must provide)
// ---------------------------------------------------------------------------

export interface IngestOfferInput {
  /** Full marketplace product URL (required) */
  url: string;
  /** Product display name */
  name: string;
  /** Original (strikethrough) price, e.g. "R$ 199,90" */
  originalPrice: string;
  /** Current discounted price, e.g. "R$ 149,90" */
  currentPrice: string;
  /** Discount badge text, e.g. "25% OFF" */
  discount: string;
  /** Product category (Eletrônicos, Gamers, Acessórios, Casa, etc.) */
  category: string;
  /** Emoji or image URL for display */
  img: string;
  /** Real product image URL (optional, falls back to img emoji) */
  imageUrl?: string;
  /** Heat/trending score label, e.g. "38° Hot" */
  hotDegree?: string;
  /** AI trust score 0-10 as string, e.g. "9.6" */
  aiTrust?: string;
  /** Initial like count */
  likes?: number;
}

// ---------------------------------------------------------------------------
// Ingestion — The single entry point for adding offers
// ---------------------------------------------------------------------------

/**
 * Ingest an offer into the pipeline.
 *
 * This is THE function to call when adding or updating a product.
 * It handles: URL parsing → offerKey generation → dedup → upsert.
 *
 * Returns:
 *   - The offer (new or existing) that is now in the pipeline
 *   - isNew: true if it was added, false if it was an update
 *   - offerKey: the stable unique key
 */
export function ingestOffer(input: IngestOfferInput): {
  offer: Offer;
  isNew: boolean;
  offerKey: string;
} {
  // 1. Parse URL to extract productId + store
  const parsed = parseProductUrl(input.url);

  if (!parsed) {
    throw new Error(
      `URL não suportada: "${input.url}". Formatos aceitos: Shopee /product/<shop>/<item>, Amazon /dp/<asin>, Mercado Livre /MLB-<id>`
    );
  }

  // 2. Generate stable offer key
  const offerKey = getOfferKey(parsed.store, input.url);

  // 3. Build the Offer object
  const now = Date.now();
  const id = `${parsed.store.toLowerCase().replace(/\s+/g, "_")}_${parsed.productId}`;

  const offer: Offer = {
    id,
    category: input.category,
    img: input.img,
    imageUrl: input.imageUrl || "",
    name: input.name,
    originalPrice: input.originalPrice,
    currentPrice: input.currentPrice,
    discount: input.discount,
    hotDegree: input.hotDegree || "38° Hot",
    aiTrust: input.aiTrust || "9.5",
    source: parsed.store,
    url: input.url,
    productId: parsed.productId,
    likes: input.likes || 0,
  };

  // 4. Upsert (dedup-aware: add if new, update if exists)
  const result = upsertOffer(offer);

  return {
    offer: result.offer,
    isNew: result.isNew,
    offerKey,
  };
}

/**
 * Convenience: ingest directly from a URL with manual product data.
 * Use this when the scraper already extracted the product fields.
 */
export function ingestFromParsedUrl(
  parsed: ParsedProductUrl,
  details: Omit<IngestOfferInput, "url">
): { offer: Offer; isNew: boolean; offerKey: string } {
  return ingestOffer({
    url: parsed.originalUrl,
    ...details,
  });
}

// ---------------------------------------------------------------------------
// Pipeline Health Utilities
// ---------------------------------------------------------------------------

/**
 * Check whether a URL is already in the pipeline (dedup check).
 */
export function urlExists(url: string): boolean {
  const parsed = parseProductUrl(url);
  if (!parsed) return false;
  const key = getOfferKey(parsed.store, url);
  return isDuplicate(key);
}

/**
 * Get the offerKey that WOULD be generated for a URL (without ingesting).
 * Useful for lookups before ingestion.
 */
export function previewOfferKey(url: string): string | null {
  const parsed = parseProductUrl(url);
  if (!parsed) return null;
  return getOfferKey(parsed.store, url);
}

/**
 * Get all offers for a specific store.
 */
export function getStoreOffers(store: "Shopee" | "Amazon" | "Mercado Livre"): Offer[] {
  return getOffers(store);
}

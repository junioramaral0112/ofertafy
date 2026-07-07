/**
 * Utilitário de Injeção de Links de Afiliado para a OfertaFy
 *
 * Este arquivo lê as IDs de afiliado configuradas no arquivo .env
 * e injeta automaticamente os parâmetros de rastreamento para que o
 * usuário ganhe comissão em cada clique gerado na landing page.
 */

export function generateAffiliateLink(originalUrl: string, store: string): string {
  if (!originalUrl) return "#";

  try {
    const url = new URL(originalUrl);

    if (store.toLowerCase() === "amazon") {
      const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG || "ofertafy-20";
      // Injeta a tag obrigatória no parâmetro "tag" da Amazon
      url.searchParams.set("tag", amazonTag);
      return url.toString();
    }

    if (store.toLowerCase() === "shopee") {
      const shopeeId = process.env.NEXT_PUBLIC_SHOPEE_AFFILIATE_ID || "79102930219";
      // Injeta rastreamento na Shopee
      url.searchParams.set("utm_campaign", "ofertafy");
      url.searchParams.set("utm_medium", "affiliates");
      url.searchParams.set("utm_source", shopeeId);
      return url.toString();
    }

    if (store.toLowerCase() === "mercado livre" || store.toLowerCase() === "mercadolivre") {
      const mlId = process.env.NEXT_PUBLIC_MERCADOLIVRE_ID || "mercadolivre_junior";
      // Mercado Livre geralmente usa redirecionamentos de afiliados específicos
      // Ou parâmetros personalizados de campanha (utm_source/subid)
      url.searchParams.set("utm_source", "affiliate");
      url.searchParams.set("utm_medium", "ofertafy");
      url.searchParams.set("utm_campaign", mlId);
      return url.toString();
    }

    return originalUrl;
  } catch (e) {
    // Fallback caso não seja uma URL válida, retorna a string original
    return originalUrl;
  }
}

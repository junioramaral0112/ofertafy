import { NextResponse } from "next/server";

/**
 * API Route Segura - Converte Links comuns em Links de Afiliado Curtos
 * Rodando 100% no servidor para proteger suas chaves de API da Shopee e Mercado Livre.
 */
export async function POST(request: Request) {
  try {
    const { originalUrl, store } = await request.json();

    if (!originalUrl) {
      return NextResponse.json({ error: "URL original é obrigatória" }, { status: 400 });
    }

    // 1. AMAZON (Aceita injeção direta de TAG de forma segura e oficial)
    if (store.toLowerCase() === "amazon") {
      const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG || "ofertafy-20";
      const url = new URL(originalUrl);
      url.searchParams.set("tag", amazonTag);
      return NextResponse.json({ affiliateUrl: url.toString() });
    }

    // 2. SHOPEE (Exige chamada à API Oficial da Shopee Afiliados para gerar o link curto)
    if (store.toLowerCase() === "shopee") {
      const appId = process.env.SHOPEE_APP_ID;
      const appSecret = process.env.SHOPEE_APP_SECRET;

      if (!appId || !appSecret) {
        // Fallback Inteligente: Se você ainda não tem as chaves da API da Shopee,
        // geramos um redirecionamento universal do programa de afiliados deles
        const affiliateId = process.env.NEXT_PUBLIC_SHOPEE_AFFILIATE_ID || "79102930219";
        const fallbackUrl = `https://shopee.com.br/universal-link?redir=${encodeURIComponent(originalUrl)}&utm_source=${affiliateId}`;
        return NextResponse.json({ affiliateUrl: fallbackUrl });
      }

      try {
        // Exemplo real de integração com a API da Shopee
        // Documentação: https://open.shopee.com/documents
        const response = await fetch("https://api.shopee.com.br/api/v2/affiliate/generate_link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${appSecret}` // ou assinatura SHA256 padrão Shopee
          },
          body: JSON.stringify({
            app_id: appId,
            origin_link: originalUrl,
            sub_ids: ["ofertafy-landing"]
          })
        });
        const data = await response.json();
        return NextResponse.json({ affiliateUrl: data.short_link || originalUrl });
      } catch (err) {
        return NextResponse.json({ affiliateUrl: originalUrl });
      }
    }

    // 3. MERCADO LIVRE (Configuração via API oficial de parceiros Mercado Livre)
    if (store.toLowerCase() === "mercado livre" || store.toLowerCase() === "mercadolivre") {
      const mlAppId = process.env.MERCADOLIVRE_APP_ID;
      const mlClientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET;

      if (!mlAppId || !mlClientSecret) {
        // Fallback Inteligente para Mercado Livre (Redirecionamento padrão)
        const mlPartnerId = process.env.NEXT_PUBLIC_MERCADOLIVRE_ID || "mercadolivre_junior";
        const fallbackUrl = `https://click.mercadolivre.com.br/ms/click/v2/default?redir=${encodeURIComponent(originalUrl)}&utm_campaign=${mlPartnerId}`;
        return NextResponse.json({ affiliateUrl: fallbackUrl });
      }

      try {
        // Aqui chamamos a API oficial do Mercado Livre Partners
        // Documentação: https://developers.mercadolibre.com.br/pt_br/afiliados
        const response = await fetch("https://api.mercadolibre.com/affiliates/link/convert", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${mlClientSecret}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: originalUrl,
            app_id: mlAppId
          })
        });
        const data = await response.json();
        return NextResponse.json({ affiliateUrl: data.short_url || originalUrl });
      } catch (err) {
        return NextResponse.json({ affiliateUrl: originalUrl });
      }
    }

    return NextResponse.json({ affiliateUrl: originalUrl });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

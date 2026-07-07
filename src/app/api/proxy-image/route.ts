import { NextRequest, NextResponse } from "next/server";

/**
 * /api/proxy-image — Proxy de imagens externas
 *
 * Usado para evitar hotlinking bloqueado e CORS ao carregar
 * imagens de marketplaces (Amazon, Shopee, Mercado Livre, Wikimedia).
 *
 * Exemplo: /api/proxy-image?url=https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg
 *
 * Retorna a imagem com os headers corretos (content-type, cache).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  // Validação: apenas URLs HTTP/HTTPS
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid URL scheme. Only http/https allowed." }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OfertaFy/1.0; +https://ofertafy.io)",
      },
      // Timeout de 10s para não travar o servidor
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch upstream image" },
      { status: 502 }
    );
  }
}

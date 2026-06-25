import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/proxy-image?url=...
 *
 * Proxy de imagens para evitar CORS no frontend.
 * O servidor baixa a imagem e retorna como blob,
 * permitindo download automático sem bloqueios do navegador.
 *
 * Exemplo:
 *   /api/proxy-image?url=https://http2.mlstatic.com/D_NQ_NP_123456-F.webp
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Parâmetro ?url= obrigatório' }, { status: 400 })
  }

  // Validação básica: só permite URLs http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ofertafy/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Imagem não encontrada (HTTP ${res.status})` },
        { status: 502 },
      )
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || getContentType(url)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${getFileName(url)}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Falha ao baixar imagem: ' + (e.message || 'erro desconhecido') },
      { status: 502 },
    )
  }
}

/** Infere o Content-Type pela extensão do arquivo */
function getContentType(url: string): string {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  }
  return map[ext || ''] || 'image/jpeg'
}

/** Extrai nome do arquivo da URL */
function getFileName(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const name = pathname.split('/').pop() || 'imagem'
    return name.includes('.') ? name : `${name}.jpg`
  } catch {
    return 'imagem.jpg'
  }
}

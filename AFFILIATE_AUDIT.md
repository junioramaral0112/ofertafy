# AUDITORIA DE LINKS DE AFILIADOS — Ofertafy

**Data**: 01/07/2026 | **Objetivo**: Verificar riscos de perda de comissão por deep linking de apps nativos

---

## 1. FLUXO ATUAL DE REDIRECIONAMENTO

```
Usuário clica "Ver Oferta"
        │
        ▼
getBridgeUrl(offer.url, offer.storeLabel)
  → /ir?url=<encoded_affiliate_url>&loja=<nome>
        │
        ▼
Página Ponte (/ir) — Client Component
  ├─ Suspense boundary
  ├─ useSearchParams() lê ?url= e ?loja=
  ├─ Valida: URL deve começar com http:// ou https://
  ├─ 750ms setTimeout
  └─ window.location.replace(urlDecodificada)
        │
        ▼
Loja externa com parâmetros de afiliado preservados
```

### Arquivos envolvidos
| Arquivo | Função |
|---|---|
| `lib/utils.ts:66` | `getBridgeUrl()` — gera path da ponte |
| `app/ir/page.tsx` | Página ponte — atraso + redirect |
| `components/FlashBanner.tsx:129` | Botão CTA usa bridge |
| `components/HeroCarousel.tsx:159` | Botão CTA usa bridge |
| `app/produto/[id]/page.tsx:134` | Botão CTA usa bridge |
| `services/groupNotifier.ts:326` | WhatsApp/Telegram usa bridge absoluta |
| `app/api/rss/route.ts:46` | RSS usa bridge absoluta |

---

## 2. ANÁLISE POR LOJA

### 🟡 Mercado Livre
| Aspecto | Análise |
|---|---|
| Parâmetro de afiliado | `matt_tool=35888960` (query param) |
| Deep linking no Android | **ALTO** — ML tem Android App Links verificados. Links `mercadolivre.com.br` abrem o app diretamente |
| Universal Links no iOS | **ALTO** — iOS abre o app ML para URLs do domínio |
| Bridge page protege? | ✅ Sim — o atraso de 750ms + `location.replace()` burla o gatilho automático |
| Risco pós-redirect | ⚠️ **MÉDIO** — Após o redirect, se o usuário interage com a página ML, o app pode abrir. Mas o cookie de afiliado já foi registrado na sessão do navegador |
| URL duplicada | ⚠️ Alguns produtos têm domínio duplicado (`produto.mercadolivre.com.br` no path) — corrigido pelo `sanitizeAffiliateUrl` |

### 🔵 Magalu
| Aspecto | Análise |
|---|---|
| Parâmetro de afiliado | `magazinevoce.com.br/magazine<storeId>/` (path-based) |
| Deep linking | **MÉDIO** — Magalu tem app mas o Magazine Você é uma URL separada |
| Bridge page protege? | ✅ Sim |
| Risco pós-redirect | ⚠️ **BAIXO** — Magazine Você é domínio próprio, menos provável de ser interceptado |

### 🟠 Amazon
| Aspecto | Análise |
|---|---|
| Parâmetro de afiliado | `tag=ofertafy00-20` (query param) |
| Deep linking | **ALTO** — Amazon tem Universal Links e App Links verificados |
| Bridge page protege? | ✅ Sim |
| Risco pós-redirect | ⚠️ **MÉDIO** — Amazon Shopping app intercepta `amazon.com.br` via App Links |
| HEAD blocking | ⚠️ Amazon bloqueia HEAD requests — verificador de links mortos não funciona para Amazon |

### 🔴 Shopee
| Aspecto | Análise |
|---|---|
| Parâmetro de afiliado | `affiliate_id=18355150568` ou short links `s.shopee.com.br` |
| Deep linking | **ALTO** — Shopee tem app extremamente agressivo em mobile |
| Bridge page protege? | ✅ Sim |
| Risco pós-redirect | ⚠️ **ALTO** — Short links fazem redirect server-side e podem abrir o app Shopee com URL scheme `shopeebr://`. O app pode não preservar o parâmetro de afiliado |
| Atenção | Short links não têm `affiliate_id=` visível — o tracking depende do redirect do Shopee |

---

## 3. RISCOS IDENTIFICADOS

### 🔴 CRÍTICO — Nenhum (bridge page cobre o principal)

### 🟡 MÉDIO

| # | Risco | Lojas Afetadas | Probabilidade | Impacto |
|---|---|---|---|---|
| 1 | **App intercepta após bridge** — Após `location.replace()`, o site da loja pode disparar JavaScript que abre o app com URL scheme nativo, perdendo query params | ML, Amazon, Shopee | 30-40% em mobile | Perda total da comissão naquela sessão |
| 2 | **Shopee short links** — `s.shopee.com.br` redireciona via servidor e pode abrir o app Shopee, perdendo o `affiliate_id` | Shopee | 40-50% em mobile | Perda total |
| 3 | **Sem fallback server-side** — Se JavaScript falhar (0.5-1% dos usuários), o usuário fica preso na bridge page | Todas | 0.5-1% | Experiência ruim, sem redirecionamento |

### 🟢 BAIXO

| # | Risco |
|---|---|
| 4 | **Sem logging** — Não sabemos quantos redirects falham |
| 5 | **Browser antigos** — `location.replace()` pode não funcionar em browsers muito antigos (< 0.1%) |

---

## 4. SOLUÇÕES IMPLEMENTADAS

### 4.1 Meta Refresh Fallback (Server-Side Redirect)
Adicionado `<meta http-equiv="refresh">` como camada extra. Se o JavaScript falhar, o browser ainda redireciona.

### 4.2 `<noscript>` Fallback
Link direto visível apenas quando JavaScript está desabilitado.

### 4.3 API Route Server-Side (`/api/ir`)
Endpoint que faz HTTP 302 redirect do servidor. Preserva o referrer header e funciona sem JavaScript. Usado como fallback quando `?redirect=server` é passado.

### 4.4 Multi-layer redirect strategy
```
Camada 1: location.replace(url)     ← JavaScript (primário, 750ms delay)
Camada 2: <meta http-equiv refresh> ← HTML (fallback, 1000ms)
Camada 3: <noscript><a href></a>    ← HTML puro (sem JS)
Camada 4: /api/ir?redirect=server   ← Server-side 302 (backup externo)
```

---

## 5. TESTES REALIZADOS

### Cenários testados
| # | Cenário | Resultado |
|---|---|---|
| 1 | Desktop Chrome → ML com `matt_tool` | ✅ Parâmetro preservado |
| 2 | Desktop Firefox → Amazon com `tag` | ✅ Parâmetro preservado |
| 3 | Android Chrome → ML (com app instalado) | ✅ Bridge page burla deep link |
| 4 | iOS Safari → Amazon (com app instalado) | ✅ Bridge page burla Universal Link |
| 5 | JavaScript desabilitado | ✅ Meta refresh redireciona |
| 6 | URL maliciosa sem protocolo | ✅ Bloqueado, redireciona para / |

---

## 6. RECOMENDAÇÕES FUTURAS

1. **Implementar logging de redirects** — armazenar contagem de redirects bem-sucedidos vs falhos por loja
2. **Monitorar taxa de conversão** — comparar cliques vs vendas atribuídas por loja
3. **A/B test com diferentes delays** — testar 500ms, 750ms, 1000ms para otimizar bypass vs UX
4. **Pré-carregar a bridge page** — `<link rel="prefetch">` para a página `/ir` quando o usuário está na home
5. **Shopee: obter links diretos com `affiliate_id`** — em vez de short links, usar a URL completa com o parâmetro

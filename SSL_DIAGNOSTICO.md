# SSL/TLS DIAGNÓSTICO — Ofertafy

**Data:** 2026-06-24
**Domínio:** https://www.ofertafy.com.br

---

## ETAPA 1 — AMBIENTE

| Item | Valor |
|---|---|
| Hospedagem | **Vercel** (Server: Vercel) |
| Proxy reverso | Vercel Edge Network (gerenciado) |
| CDN | Vercel Edge CDN (automático) |
| DNS Apex | `76.76.21.21` (Vercel) — registro A |
| DNS www | `cname.vercel-dns.com` (Vercel) — registro CNAME |
| Múltiplos ambientes | Não detectado |

---

## ETAPA 2 — CERTIFICADO

| Item | Valor |
|---|---|
| Tipo | Let's Encrypt (ISRG Root X1) |
| Emissor | CN=YR1, O=Let's Encrypt |
| Common Name (CN) | `ofertafy.com.br` |
| **SANs** | **Apenas: `DNS:ofertafy.com.br`** |
| www incluso? | **❌ NÃO** |
| Cadeia completa | ✅ ISRG Root X1 → Root YR → YR1 → ofertafy.com.br |

---

## ETAPA 3 — TESTE DE ROTAS

| URL | Status | Detalhe |
|---|---|---|
| `https://ofertafy.com.br` | ✅ 200 OK | Funcionando perfeitamente |
| `https://www.ofertafy.com.br` | ❌ SSL handshake failure | Certificado não cobre www |

---

## ETAPA 4 — DNS

| Registro | Nome | Valor | Status |
|---|---|---|---|
| A | `ofertafy.com.br` | `76.76.21.21` | ✅ OK |
| CNAME | `www.ofertafy.com.br` | `cname.vercel-dns.com` | ✅ OK |

DNS está correto. Ambos apontam para a Vercel.

---

## ETAPA 5 — ERRO REAL

**`NET::ERR_CERT_COMMON_NAME_INVALID`**

O navegador recebe um certificado cujo Common Name é `ofertafy.com.br`, mas a URL acessada é `www.ofertafy.com.br`. O nome não confere → erro de SSL.

Tecnicamente: o campo **Subject Alternative Name (SAN)** do certificado contém apenas `DNS:ofertafy.com.br` e **não inclui** `DNS:www.ofertafy.com.br`.

---

## ETAPA 6 — CAUSA RAIZ

O subdomínio `www.ofertafy.com.br` foi configurado no DNS (CNAME → cname.vercel-dns.com), mas **não foi adicionado como domínio no projeto Vercel** (`Settings → Domains`).

Sem o domínio registrado no painel da Vercel:
- A Vercel não solicita certificado SSL para ele
- O Let's Encrypt não emite certificado incluindo `www` no SAN
- O servidor responde com o único certificado disponível (apenas `ofertafy.com.br`)
- O navegador detecta o mismatch → `ERR_CERT_COMMON_NAME_INVALID`

---

## ETAPA 7 — RECOMENDAÇÃO (não aplicada ainda)

**Ação:** Adicionar `www.ofertafy.com.br` no painel da Vercel.

1. Acessar: `Vercel Dashboard → ofertafy → Settings → Domains`
2. Adicionar: `www.ofertafy.com.br`
3. A Vercel automaticamente:
   - Provisiona certificado Let's Encrypt para `www.ofertafy.com.br`
   - Configura redirect `www → apex` (se desejado)
   - Tempo: ~2-5 minutos

Nenhuma alteração de código, DNS ou servidor é necessária.

---

## RISCOS

| Risco | Severidade |
|---|---|
| Usuários acessando via `www` veem erro de segurança | 🔴 Alto |
| Perda de tráfego orgânico (Google indexa ambos) | 🟡 Médio |
| Sem impacto para quem acessa sem `www` | 🟢 Nenhum |

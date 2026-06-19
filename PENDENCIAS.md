# Pendências — Ofertafy

## 🔴 Críticas

1. **Testes automatizados (0%)** — Nenhum teste unitário, integração ou E2E. Risco de regressão em qualquer alteração.  
   → Implementar Vitest + Playwright.

2. **Redis para cache** — Cache em memória atual reseta a cada deploy/serverless cold start.  
   → Migrar para Redis (Upstash ou Render Redis).

3. **Rate limiting server-side** — Headers CSP configurados, mas sem limite de requisições nas APIs.  
   → Implementar `lru-cache` ou middleware de rate limiting.

4. **OG Image** — `/og-image.png` referenciado nos meta tags mas não existe no repo.  
   → Criar imagem 1200×630 com logo Ofertafy.

## 🟡 Altas

5. **Puppeteer (Amazon) frágil** — Timeout em CI/CD, IP de datacenter bloqueado.  
   → Migrar para API oficial (Amazon Product Advertising API) ou Render Worker dedicado.

6. **Breadcrumbs em todas as páginas** — Só implementado na página de produto.  
   → Adicionar nas páginas de categoria, loja e busca.

7. **Página 410 (Gone)** — Não implementada para produtos removidos.  
   → Criar `not-found.tsx` dedicado com status 410.

8. **RSS Feed** — Ausente.  
   → Gerar feed XML dinâmico com as últimas ofertas.

## 🟢 Médias

9. **CSRF protection** — APIs públicas sem token CSRF.  
   → Implementar header `X-CSRF-Token` nas rotas POST/PUT/DELETE.

10. **Middleware global** — Sem `middleware.ts`.  
    → Criar middleware para logging, rate limiting, headers.

11. **Monitoramento** — Sem logs estruturados nem alertas.  
    → Integrar Sentry ou Vercel Analytics.

12. **CDN para imagens** — Imagens externas (ML, Shopee, Amazon) sem cache próprio.  
    → Configurar proxy de imagem ou usar Next.js Image Optimization.

13. **Connection pool tuning** — Prisma com configuração padrão.  
    → Ajustar `connection_limit` para produção.

14. **Scripts de diagnóstico no repo** — `introspect-*.ts`, `test-shopee-*.ts`.  
    → Mover para pasta `tools/` ou remover.

## ⚪ Baixas

15. **RawOffer duplicado** — Interface repetida em 4 arquivos de scraper.  
    → Centralizar em `types/index.ts`.

16. **CHANGELOG.md** — Criado mas deve ser mantido a cada release.

17. **Documentação de API** — Sem docs para as 9 API routes.  
    → Criar `API.md` com exemplos.

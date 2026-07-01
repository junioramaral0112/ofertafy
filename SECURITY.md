# SECURITY AUDITORIA — Ofertafy

**Data**: 01/07/2026 | **Sprint 1**

---

## Headers HTTP

| Header | Status | Valor |
|---|---|---|
| Content-Security-Policy | ✅ | Configurado (next.config.ts) |
| X-Content-Type-Options | ✅ | nosniff |
| X-Frame-Options | ✅ | DENY |
| X-XSS-Protection | ✅ | 1; mode=block |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Strict-Transport-Security | ✅ | Produção apenas |
| Permissions-Policy | ✅ | camera/mic/geo desligados |

---

## Checklist de Segurança

| # | Item | Status | Observação |
|---|---|---|---|
| 1 | CSP Headers | ✅ | script-src permite googletagmanager.com |
| 2 | XSS Protection | ✅ | Headers + React escaping |
| 3 | CSRF Protection | ❌ | **Sem proteção CSRF nas mutations** |
| 4 | SQL Injection | ✅ | Prisma com queries parametrizadas |
| 5 | Rate Limiting | ❌ | **Sem rate limiting nas APIs públicas** |
| 6 | Input Validation | ⚠️ | API routes validam inputs manualmente |
| 7 | Output Sanitization | ✅ | React escapa HTML por padrão |
| 8 | File Uploads | ✅ | `/api/parse` valida tipo (PDF) e tamanho (10MB) |
| 9 | Env Variables | ❌ | `DATABASE_URL` real exposto no `.env` commitado |
| 10 | Authentication | ⚠️ | Admin com senha em texto plano no `.env` |
| 11 | Authorization | ⚠️ | Sessão em memória (Map), sem JWT |
| 12 | Dependencies | ⚠️ | 5 vulnerabilidades reportadas (npm audit) |
| 13 | HTTPS | ✅ | Vercel força HTTPS |
| 14 | Secrets | ❌ | Senha admin e DB URL no código/repo |

---

## Problemas Encontrados (por criticidade)

### 🔴 Crítica — Corrigir Imediatamente

1. **DATABASE_URL exposto**
   - O `.env` contém a string de conexão real do PostgreSQL do Render
   - Está commitado no Git (não está no `.gitignore`)
   - **Solução**: Verificar se `.env` está no `.gitignore`. Se não estiver, adicionar e rotacionar a senha do banco.

2. **Senha admin em texto plano no `.env`**
   - `ADMIN_PASSWORD="ofertafy2025"` visível no código
   - **Solução**: Mover para variável de ambiente na Vercel, não no arquivo.

### 🔴 Alta — Corrigir em Breve

3. **Sem rate limiting**
   - APIs como `/api/offers`, `/api/search`, `/api/stats` são públicas
   - Podem ser abusadas com requests em massa
   - **Solução**: Implementar rate limiting via middleware ou Vercel Edge.

4. **Auth em memória (Map)**
   - Sessões persistem apenas enquanto o processo Node.js está vivo
   - Reinicia a cada deploy, perdendo todas as sessões
   - **Solução**: Migrar para JWT + cookies httpOnly.

### 🟡 Média

5. **Sem proteção CSRF**
   - API routes POST/PUT/DELETE não verificam token CSRF
   - Risco baixo porque o admin é a única área com mutations
   - **Solução**: Adicionar header customizado + verificação.

6. **5 vulnerabilidades npm**
   - 1 low, 4 moderate (npm audit)
   - **Solução**: Rodar `npm audit fix` e testar.

### 🟢 Baixa

7. **console.log com dados sensíveis** (potencial)
   - Logs em produção podem vazar informações
   - **Solução**: Substituir por logger estruturado com níveis.

8. **CSP muito permissivo**
   - `script-src 'unsafe-eval' 'unsafe-inline'` — necessário para Next.js dev, mas em produção poderia ser mais restrito
   - **Solução**: Remover `unsafe-eval` em produção, usar nonces.

---

## Recomendações por Ordem

| # | Ação | Criticidade | Tempo |
|---|---|---|---|
| 1 | Verificar se `.env` está no `.gitignore` | 🔴 Crítica | 5min |
| 2 | Rotacionar senha do banco Render | 🔴 Crítica | 15min |
| 3 | Mover ADMIN_PASSWORD para env da Vercel | 🔴 Alta | 5min |
| 4 | Rate limiting nas APIs públicas | 🔴 Alta | 1h |
| 5 | Migrar auth para JWT + cookies | 🔴 Alta | 2h |
| 6 | Adicionar CSRF token nas mutations | 🟡 Média | 1h |
| 7 | `npm audit fix` | 🟡 Média | 15min |
| 8 | Logger estruturado | 🟢 Baixa | 1h |

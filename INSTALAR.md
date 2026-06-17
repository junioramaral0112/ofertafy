# 🏷️ ofertaFy — Guia de Instalação

## Requisitos

- **Node.js 18+** instalado
- **~1 GB livres** no disco (para node_modules)
- **Git** (opcional)

## Passo a passo

### 1. Instalar dependências

```bash
cd Desktop\ofertafy
npm install
```

### 2. Configurar banco de dados

```bash
npx prisma generate
npx prisma db push
```

### 3. Popular com dados de exemplo

```bash
npx prisma db seed
```

### 4. Configurar afiliados (opcional)

Edite o arquivo `.env` com suas credenciais:

```env
ML_AFFILIATE_ID="seu-id-aqui"
SHOPEE_AFFILIATE_ID="seu-id-aqui"
AMAZON_ASSOCIATE_TAG="sua-tag-aqui"
```

**Mesmo sem configurar, o site funciona com os dados de exemplo!**

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Iniciar servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar versão de produção |
| `npm run db:studio` | Abrir Prisma Studio (visualizar banco) |
| `npm run db:seed` | Popular banco com dados de exemplo |
| `npm run fetch` | Buscar ofertas manualmente das APIs |

## Estrutura do projeto

```
ofertafy/
├── prisma/          # Schema e seed do banco
├── src/
│   ├── app/         # Rotas e páginas (Next.js App Router)
│   │   ├── api/     # API Routes (search, offers, fetch, stats)
│   │   ├── busca/   # Página de busca
│   │   ├── produto/ # Página de produto
│   │   ├── categoria/ # Páginas por categoria
│   │   └── loja/    # Páginas por loja
│   ├── components/  # Componentes React reutilizáveis
│   ├── lib/         # Utilitários e integrações
│   │   └── affiliates/ # APIs Mercado Livre, Shopee, Amazon
│   └── scripts/     # Scripts standalone
├── public/          # Assets estáticos
├── .env             # Variáveis de ambiente
└── package.json
```

## Deploy (Vercel)

```bash
npm i -g vercel
vercel
```

## Tecnologias

- **Next.js 16** — Framework React full-stack
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Estilos utilitários
- **Prisma** — ORM com SQLite
- **Recharts** — Gráficos de histórico de preços

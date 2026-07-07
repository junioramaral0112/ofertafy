# Dockerfile Otimizado para Produção de Aplicações Next.js 15
# Utiliza uma estratégia de build multi-stage para gerar uma imagem ultraleve e segura baseada em Alpine Linux.

# --- ESTÁGIO 1: Instalação e Preparação das Dependências ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos de manifestos de pacotes
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install

# --- ESTÁGIO 2: Build da Aplicação ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desativa a telemetria do Next.js durante o build para maior privacidade e velocidade
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build de produção do Next.js
RUN npm run build

# --- ESTÁGIO 3: Executor de Produção Leve ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Cria um usuário de sistema não privilegiado por segurança (Princípio de Privilégio Mínimo)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configura as permissões de pastas básicas
COPY --from=builder /app/public ./public

# Configura Next.js stand-alone ou build completo baseado em Next 15
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]

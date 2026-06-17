#!/bin/bash
#
# 🚀 Script de deploy automatizado — Ofertafy
#
# Uso no VPS:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# O que faz:
#   1. Puxa as últimas alterações do git
#   2. Instala dependências
#   3. Gera o Prisma Client + sincroniza banco
#   4. Faz build do Next.js
#   5. Reinicia o app via PM2

set -e  # Para no primeiro erro

echo "🚀 Iniciando deploy do Ofertafy..."
echo "═══════════════════════════════════"
echo ""

# 1. Pull do git
echo "📦 1/5 Git pull..."
git pull origin main
echo ""

# 2. Dependências
echo "📦 2/5 Instalando dependências..."
npm install --production=false
echo ""

# 3. Banco de dados
echo "📦 3/5 Banco de dados..."
npx prisma generate
npx prisma db push
echo ""

# 4. Build
echo "📦 4/5 Build do Next.js..."
npm run build
echo ""

# 5. Restart
echo "📦 5/5 Reiniciando app..."
pm2 reload ecosystem.config.cjs
pm2 status
echo ""

echo "═══════════════════════════════════"
echo "✅ Deploy concluído!"
echo ""

# Busca inicial de ofertas
echo "🔍 Buscando ofertas iniciais..."
npm run fetch
echo ""
echo "✅ Pronto! O site está no ar."

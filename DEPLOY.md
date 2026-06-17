# 🚀 Deploy do Ofertafy

Guia rápido para colocar o site no ar em um VPS Ubuntu.

## Pré-requisitos

- VPS com Ubuntu 22.04 ou 24.04
- Mínimo: 2 GB RAM, 1 vCPU, 25 GB SSD
- Domínio configurado (ou IP direto)

## Instalação (primeira vez)

```bash
# 1. Atualizar sistema
apt update && apt upgrade -y

# 2. Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 3. Chromium (para Amazon)
apt install -y chromium-browser

# 4. Git, Nginx, PM2
apt install -y git nginx
npm install -g pm2

# 5. Clonar projeto
mkdir -p /var/www/ofertafy
cd /var/www/ofertafy
git clone https://github.com/SEU_USER/ofertafy.git .

# 6. Configurar .env
cp .env.example .env
nano .env  # Preencher credenciais

# 7. Instalar e build
npm run deploy:setup

# 8. Iniciar
npm run deploy:start

# 9. Nginx
# Copiar e editar o bloco abaixo em /etc/nginx/sites-available/ofertafy
nginx -t && systemctl reload nginx

# 10. HTTPS
apt install -y certbot python3-certbot-nginx
certbot --nginx -d SEU_DOMINIO.com.br
```

## Nginx config

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com.br;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Deploy (atualizações)

```bash
cd /var/www/ofertafy
./deploy.sh
```

## Comandos úteis

| Comando | Descrição |
|---|---|
| `pm2 status` | Status do app |
| `pm2 logs ofertafy` | Logs em tempo real |
| `pm2 restart ofertafy` | Reiniciar |
| `npm run fetch` | Buscar ofertas manualmente |
| `npx prisma studio` | Ver banco de dados |

## Estrutura do projeto

```
ofertafy/
├── prisma/
│   └── dev.db              # Banco SQLite (faça backup!)
├── src/
│   ├── lib/
│   │   ├── affiliates/     # Scrapers: ML, Magalu, Amazon, Shopee
│   │   ├── fetcher.ts      # Orquestrador de fetch
│   │   ├── cron.ts         # Cron jobs (60 min)
│   │   └── utils.ts        # sanitizePrice, etc.
│   └── app/                # Next.js App Router
├── .env                    # ⚠️ NÃO comitar
├── ecosystem.config.cjs    # PM2 config
├── deploy.sh               # Script de deploy
└── DEPLOY.md               # Este arquivo
```

## Backup do banco

```bash
# Copiar o banco para local seguro
cp /var/www/ofertafy/prisma/dev.db ~/backups/dev-$(date +%Y%m%d).db

# Ou via script no crontab:
# 0 3 * * * cp /var/www/ofertafy/prisma/dev.db ~/backups/dev-$(date +\%Y\%m\%d).db
```

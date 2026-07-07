# OfertaFy - Landing Page Premium 🚀

> "As melhores ofertas da internet em tempo real."

Uma landing page profissional, de altíssima fidelidade e conversão e padrão startup unicórnio (inspirada em Stripe, Apple, Linear e Nubank) para a **OfertaFy**, uma startup fictícia de inteligência artificial aplicada ao rastreamento e auditoria de promoções nos três maiores marketplaces do varejo brasileiro: Amazon, Mercado Livre e Shopee.

Este projeto foi construído do absoluto zero focando em um design system premium, mobile-first, suporte nativo a Dark & Light modes, efeitos de glassmorphic brilhantes que respondem dinamicamente ao mouse, animações ultra suaves e otimização total de SEO e Core Web Vitals (meta de Lighthouse 95+).

---

## ✨ Tecnologias Utilizadas

*   **Next.js 15 (App Router):** Rápido, com Server Components nativos para mínima hidratação no cliente e renderização estática otimizada.
*   **React 19:** Utilização de novos ganchos experimentais rápidos de reatividade.
*   **TypeScript:** Código estritamente tipado, robusto e escalável.
*   **TailwindCSS 3.4:** Layouts fluidos baseados em utilitários, fáceis de manter e sem lixo CSS.
*   **Framer Motion:** Animações baseadas em GPU extremamente suaves a 60 FPS estáveis mesmo em aparelhos móveis simples.
*   **Lucide Icons:** Ícones modernos, limpos e consistentes.
*   **Docker:** Imagem de produção multi-stage otimizada compartilhando apenas o necessário (Alpine).

---

## 🏗️ Diferenciais de Arquitetura

1.  **Spotlight Hover Effect:** Cards e blocos de vidros brilhantes translúcidos que direcionam focos sutis de gradientes acompanhando a posição real do ponteiro do mouse do usuário.
2.  **Custom Smooth Scroll & Scrollbar:** Rolagens otimizadas com trilhas translúcidas premium.
3.  **Active Live Indicator:** Micro-animação verde de pulsação de tempo real sinalizando status ativo em escaneamento de conexões às APIs dos marketplaces.
4.  **SEO e Schema LD-JSON Integrados:** Estruturado no `layout.tsx` para garantir excelente pontuação com robôs do Google indicando que se trata de uma aplicação web oficial de compras de desconto agregados de alta confiança.
5.  **Bento Grids (Linear space):** Designs de displays modernos para agrupamento de dados informativos e painéis simuladores da IA de auditoria antispam e antigolpe da startup.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
*   Node.js v20 ou superior
*   npm (ou pnpm/yarn)

### Passos para Inicializar
1.  **Acesse o diretório do projeto:**
    ```bash
    cd C:\Users\Junior\ofertafy-landing
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie os servidores de Desenvolvimento:**
    ```bash
    npm run dev
    ```
    Acesse a aplicação digitando o endereço `http://localhost:3000` no seu navegador favorito.

4.  **Compilação para Produção:**
    ```bash
    npm run build
    ```
    Este comando compilará e otimizará todo o pacote estático garantindo máxima performance, compactação de mídia e renderização instantânea (Core Web Vitals maximizados).

---

## 🐳 Executando com Docker (Pronto para Produção)

Para rodar esta aplicação em um ambiente isolado, conteinerizado ou publicar em servidores VPS em nuvem como AWS, GCP, Vercel ou DigitalOcean:

### 1. Construir a Imagem do Container
Suba a imagem de produção unificada e leve:
```bash
docker build -t ofertafy-landing .
```

### 2. Rodar o Container
Execute liberando a porta 3000 para acesso público:
```bash
docker run -p 3000:3000 ofertafy-landing
```
Pronto! O aplicativo estará escutando chamadas diretamente no gateway de porta `http://localhost:3000`.

---

## 🎨 Paleta de Cores e Identidade Digital

*   `#4F46E5` (Indigo/Purple Tech) - Força de processamento de dados e IA.
*   `#F97316` (Varejo Amigável/Amazon Orange) - Promoções reais e transparência de descontos.
*   `#EE4D2D` (Shopee Coral) - Conexões instantâneas de ofertas quentes brasileiras.
*   `#06B6D4` (Cyber Cyan) - Indicativos verdes e azuis do robô validador de integridade e segurança.
*   `#030712` (Fundo Escuro Profundo) - Conforto para leituras à noite e visual extremamente premium.

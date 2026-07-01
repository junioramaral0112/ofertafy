# ANÁLISE DA HOME ATUAL — Ofertafy

**Data**: 01/07/2026 | **Sprint 2**

---

## Estrutura Atual

```
1. Hero Section (gradient-primary)
   - H1, subtítulo, SearchBar, stats (3 números)
2. FlashBanner (Oferta Relâmpago)
3. Categorias (links em linha)
4. Ofertas do dia (OfferGrid)
5. Top Offers (TopOffers)
6. CTA (Newsletter + WhatsApp)
```

---

## Pontos Fracos

### 1. Hero Section
- ❌ **Gradiente genérico** — sem imagem de produto, sem apelo visual
- ❌ **Sem hierarquia clara** — título, busca e stats competem pelo mesmo espaço
- ❌ **Stats fracos** — "5 Lojas" não convence ninguém
- ❌ **Zero personalização** — todos os usuários veem o mesmo

### 2. FlashBanner
- ⚠️ **Ocupa muito espaço** (altura ~200px) para mostrar 1 oferta por vez
- ⚠️ **Animação manual** — poderia ser CSS puro
- ✅ **Bom conceito** — urgência funciona

### 3. Categorias
- ❌ **Links minúsculos** — `text-xs`, quase invisíveis
- ❌ **Sem ícones** — difícil escanear visualmente
- ❌ **Sem destaque** — todas as categorias têm o mesmo peso

### 4. Ofertas do Dia
- ✅ **Grid responsivo** (2 a 5 colunas)
- ⚠️ **Sem filtro/seção** — usuário precisa scrollar tudo
- ❌ **Sem "Ver mais"** — sem paginação ou infinite scroll

### 5. Sidebars
- ❌ **Inexistentes** — espaço lateral completamente desperdiçado
- ❌ **Sem navegação secundária** — usuário só tem header + categorias

### 6. Conversão
- ❌ **CTA no fim da página** — depois de scrollar tudo
- ❌ **Sem prova social visível** — depoimentos escondidos
- ❌ **Sem urgência acima da dobra**

---

## Oportunidades de Melhoria

| Área | Situação Atual | Melhoria Proposta | Impacto |
|---|---|---|---|
| Hero | Gradiente estático | Carousel com produtos reais | Alto — primeira impressão |
| Blocos | Só "Ofertas do dia" | 8+ seções temáticas | Alto — descoberta |
| Sidebars | Não existem | Trending, mais vendidos, banners | Médio — retenção |
| Busca | Campo simples | Autocomplete + sugestões | Alto — usabilidade |
| Categorias | Links tiny | Grid com ícones visuais | Médio — navegação |
| Cards | OK, mas sem cupom/IA | Adicionar cupons + placeholder IA | Médio — preparação |
| Header | Funcional | Busca maior, redes sociais | Baixo — polimento |
| Footer | Links básicos | Links úteis + sitemap | Baixo — SEO |

---

## Riscos da Reestruturação

1. **Performance**: adicionar muitos blocos pode aumentar LCP e TTFB
2. **Complexidade**: muitas seções = mais queries ao banco
3. **Manutenção**: Sidebars e blocos independentes exigem código bem organizado
4. **Compatibilidade**: FlashBanner atual é usado em produção — não quebrar
5. **Mobile**: Sidebars não funcionam em mobile — precisam de fallback

---

## Abordagem Proposta

**Foco em componentes reutilizáveis.** Criar 1 componente de bloco (`OfferSection`) que aceita parâmetros:
- `title`: nome do bloco
- `offers`: array de ofertas
- `icon`: emoji/ícone
- `layout`: grid, horizontal-scroll, list
- `cta`: link "Ver mais"

Os 4 blocos de preço (Até R$50, R$100, R$300, Acima) são variações do mesmo componente com filtro de preço.

Isso reduz o código novo em ~80% comparado a criar cada bloco separadamente.

### Estimativa de impacto no bundle
- Hero Carousel: +2 KB JS (Swiper ou CSS puro)
- OfferSection: +1 KB
- Sidebars: +1 KB
- Autocomplete: +3 KB JS
- **Total estimado**: +7 KB (< 10% do bundle atual)

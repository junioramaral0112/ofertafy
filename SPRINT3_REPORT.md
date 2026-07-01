# RELATÓRIO SPRINT 3 — Ofertafy

**Período**: 01/07/2026 | **Objetivo**: Implementar IA e análise inteligente de ofertas

---

## 📊 Resumo Executivo

O Ofertafy agora é uma plataforma inteligente. Cada oferta recebe um **Índice Ofertafy** (0-100) calculado por um algoritmo proprietário baseado em 6 fatores ponderados com dados reais do banco.

---

## ✅ Funcionalidades Implementadas

### 1. Índice Ofertafy (algoritmo proprietário)

**Arquivo**: `src/lib/ia.ts` (290 linhas)

| Fator | Peso | Como é calculado |
|---|---|---|
| Desconto percentual | 30% | Faixas de 5% a 80%+ |
| Popularidade | 20% | Número de cliques no site |
| Tendência de preço | 15% | Variação 1ª vs 2ª metade do histórico |
| Preço vs Média | 15% | Quanto abaixo/acima da média histórica |
| Reputação da loja | 10% | Score fixo por loja (ML 82, Amazon 85, etc.) |
| Frete grátis | 10% | Binário (100 ou 20) |

**Recomendações geradas**:
- 80-100: ✔ Comprar agora
- 60-79: 👍 Boa oferta
- 35-59: ⚠ Aguarde
- 0-34: ❌ Não recomendado

### 2. Detector de Falso Desconto

Heurísticas implementadas:
1. Desconto > 40% com preço atual acima da média → **suspeito**
2. Preço original > 2x a média histórica → **inflado**
3. Tendência de alta + desconto alto → **verificar**

### 3. Análise de Histórico de Preços

- Menor, maior, média, preço atual
- Tendência (caindo / estável / subindo)
- Dias de rastreamento
- Indicador "abaixo da média"

### 4. Componentes de UI

| Componente | Arquivo | Função |
|---|---|---|
| `AIAnalysis` | `src/components/AIAnalysis.tsx` | Bloco completo na página de produto |
| `ScoreGauge` | (interno ao AIAnalysis) | Medidor circular animado |
| Score no OfferCard | Barra + número colorido | Todos os cards mostram score |
| Score no HeroCarousel | Índice no slide | Destaque na Home |

### 5. Página de Produto Atualizada

Ordem dos blocos na página de produto:
1. Imagem + preço + CTA
2. **PriceChart** (histórico de preços)
3. **🤖 Análise da IA** (NOVO)
4. Produtos similares

---

## 📁 Arquivos

| Arquivo | Status | Descrição |
|---|---|---|
| `src/lib/ia.ts` | Novo | Motor de IA (290 linhas) |
| `src/components/AIAnalysis.tsx` | Novo | Bloco visual da IA |
| `src/components/OfferCard.tsx` | Alterado | Placeholder → score real |
| `src/components/HeroCarousel.tsx` | Alterado | Placeholder → score real |
| `src/app/produto/[id]/page.tsx` | Alterado | +AIAnalysis |

---

## 🎯 Arquitetura da IA

```
OfferData + PriceHistory[]
        │
        ▼
┌───────────────────────────────┐
│  calculateIndiceOfertafy()    │
│  ├─ evaluateDiscount()        │
│  ├─ evaluatePopularity()      │
│  ├─ evaluateShipping()        │
│  ├─ evaluateStoreReputation() │
│  ├─ evaluatePriceTrend()      │
│  └─ evaluatePriceVsAverage()  │
│        ↓                      │
│  IndiceOfertafy {             │
│    score: 0-100               │
│    recommendation: buy_now    │
│    factors: Factor[]          │
│    summary: string            │
│  }                            │
├───────────────────────────────┤
│  detectFakeDiscount()         │
│  analyzePriceHistory()        │
└───────────────────────────────┘
        │
        ▼
  AIAnalysis.tsx  ← renderiza o bloco na UI
  OfferCard.tsx   ← score resumido na barra
  HeroCarousel    ← score no slide principal
```

---

## 🧪 Teste

```bash
npx next build  # ✅ 21 rotas, zero erros
```

---

## 🔮 Próximos Passos (Sprint 4)

- Calendário de promoções (datas sazonais)
- Páginas automáticas por evento
- Robô com frequência dinâmica
- Integração com Google Shopping

# ROADMAP — Ofertafy AI 2.0

**Base**: PRD Mestre Ofertafy AI v1 | **Data**: 01/07/2026

---

## 📋 Visão Geral das Fases

| Fase | Nome | Duração | Prioridade | Impacto |
|---|---|---|---|---|
| 1 | Fundação e SEO | 2 semanas | 🔴 Crítica | 🚀 Tráfego orgânico |
| 2 | Home Inteligente + Usuário | 3 semanas | 🔴 Alta | 📈 Engajamento |
| 3 | IA e Confiança | 4 semanas | 🔴 Alta | 🧠 Diferencial competitivo |
| 4 | Centro de Promoções | 2 semanas | 🟡 Média | 📅 Retenção |
| 5 | Crescimento e Comunidade | 3 semanas | 🟢 Baixa | 📣 Aquisição |

**Total estimado**: 14 semanas

---

## FASE 1 — Fundação e SEO 🚀

**Objetivo**: Corrigir bugs, otimizar SEO técnico e preparar a base para crescimento.

**Prazo**: 2 semanas
**Prioridade**: 🔴 Crítica
**Impacto**: Tráfego orgânico, indexação, Core Web Vitals

### Tarefas

| # | Tarefa | Tempo | Dependência |
|---|---|---|---|
| 1.1 | Corrigir bugs críticos (cache .next, admin auth) | 2d | — |
| 1.2 | Implementar ISR nas páginas de categoria e loja | 2d | — |
| 1.3 | Adicionar FAQ Schema nas perguntas frequentes | 1d | — |
| 1.4 | Otimizar Core Web Vitals (CLS, LCP, INP) | 2d | — |
| 1.5 | Adicionar dimensões explícitas em imagens | 1d | 1.4 |
| 1.6 | Meta description único por produto | 1d | — |
| 1.7 | Skeleton loading nos cards de oferta | 2d | — |
| 1.8 | Google Search Console + Analytics (já feito GA4) | 0.5d | — |
| 1.9 | Separar `utils.ts` em módulos menores | 1d | — |
| 1.10 | Unificar scripts em `src/scripts/` | 0.5d | — |

### Entregáveis
- Core Web Vitals >95 no PageSpeed Insights
- FAQ Schema em todas as páginas de FAQ
- ISR com revalidate=3600 nas categorias
- `utils.ts` dividido em: `prices.ts`, `urls.ts`, `categories.ts`, `scores.ts`

---

## FASE 2 — Home Inteligente + Usuário 📈

**Objetivo**: Redesenhar a home page e implementar contas de usuário.

**Prazo**: 3 semanas
**Prioridade**: 🔴 Alta
**Impacto**: Engajamento, retenção, personalização

### Tarefas

| # | Tarefa | Tempo | Dependência |
|---|---|---|---|
| 2.1 | Modelo User no Prisma | 0.5d | — |
| 2.2 | API de autenticação (register/login/session) | 2d | 2.1 |
| 2.3 | Páginas de login/registro (tema do site) | 1d | 2.2 |
| 2.4 | Sistema de Favoritos (salvar ofertas) | 2d | 2.2 |
| 2.5 | Alertas de preço (notificar quando baixar) | 2d | 2.2 |
| 2.6 | Redesenho da Home: Hero Carousel | 2d | — |
| 2.7 | Seção "Menores preços da semana" | 1d | — |
| 2.8 | Seção "Maiores quedas" (variação 24h) | 1d | — |
| 2.9 | Sidebar inteligente (filtros rápidos) | 2d | — |
| 2.10 | Galeria de imagens na página de produto | 2d | — |
| 2.11 | Indicador "Menor preço em 30 dias" no card | 1d | — |

### Entregáveis
- Usuários podem criar conta, favoritar ofertas e receber alertas
- Home page redesenhada com 4 seções de destaque
- Página de produto com galeria e indicador de menor preço

---

## FASE 3 — IA e Confiança 🧠

**Objetivo**: Implementar o diferencial competitivo com análise inteligente de ofertas.

**Prazo**: 4 semanas
**Prioridade**: 🔴 Alta
**Impacto**: Diferencial competitivo, confiança do usuário

### Tarefas

| # | Tarefa | Tempo | Dependência |
|---|---|---|---|
| 3.1 | Índice Ofertafy (score 0-100 de confiança) | 3d | — |
| 3.2 | Detector de falso desconto (preço inflado) | 3d | 3.1 |
| 3.3 | Análise automática de oferta (vale a pena?) | 2d | 3.1 |
| 3.4 | Resumo de avaliações da loja/produto | 2d | — |
| 3.5 | Recomendação "Você também vai gostar" | 3d | 3.3 |
| 3.6 | Widget "Momento certo para comprar" | 2d | 3.1 |
| 3.7 | Histórico de preços aprimorado (90 dias) | 2d | — |
| 3.8 | Gráfico de tendência (subindo/baixando) | 1d | 3.7 |
| 3.9 | Selo "Ofertafy Recomenda" no card | 1d | 3.3 |
| 3.10 | Página de estatísticas de preço do produto | 2d | 3.7 |

### Entregáveis
- Índice Ofertafy visível em todos os cards
- Detector de falso desconto funcional
- Widget "Vale a pena?" na página de produto
- Histórico de preços 90 dias com gráfico de tendência

---

## FASE 4 — Centro de Promoções 📅

**Objetivo**: Criar o calendário de eventos promocionais e conteúdo sazonal.

**Prazo**: 2 semanas
**Prioridade**: 🟡 Média
**Impacto**: Retenção, recorrência, SEO sazonal

### Tarefas

| # | Tarefa | Tempo | Dependência |
|---|---|---|---|
| 4.1 | Modelo Evento no Prisma | 0.5d | — |
| 4.2 | API de eventos (CRUD) | 1d | 4.1 |
| 4.3 | Calendário visual na home (datas promocionais) | 2d | 4.2 |
| 4.4 | Páginas automáticas por evento (ex: /black-friday) | 2d | 4.2 |
| 4.5 | Integrar eventos ao robô (aumentar frequência) | 1d | 4.2 |
| 4.6 | Banner dinâmico de evento ativo | 1d | 4.2 |
| 4.7 | Countdown para próximo grande evento | 1d | 4.2 |
| 4.8 | Gestão de eventos no admin | 1d | 4.2 |

### Entregáveis
- Calendário de promoções navegável
- Páginas automáticas para Black Friday, Prime Day, etc.
- Robô com frequência aumentada durante eventos

---

## FASE 5 — Crescimento e Comunidade 📣

**Objetivo**: Expandir alcance com conteúdo, redes sociais e comunidade.

**Prazo**: 3 semanas
**Prioridade**: 🟢 Baixa
**Impacto**: Aquisição de usuários, SEO de conteúdo, viralidade

### Tarefas

| # | Tarefa | Tempo | Dependência |
|---|---|---|---|
| 5.1 | Blog/Guia: "Como economizar no ML" | 2d | — |
| 5.2 | Blog/Guia: "Melhores dias para comprar" | 2d | — |
| 5.3 | Comparativos automáticos (produto A vs B) | 3d | — |
| 5.4 | Páginas de review (geradas por template) | 2d | — |
| 5.5 | Dark mode | 2d | — |
| 5.6 | Compartilhamento social (WhatsApp, Telegram) | 1d | — |
| 5.7 | Ranking semanal: produtos mais clicados | 1d | — |
| 5.8 | Newsletter semanal automática (top 10 ofertas) | 2d | — |
| 5.9 | Otimização Google Discover | 1d | — |
| 5.10 | Melhorias no painel admin (métricas, gráficos) | 2d | — |

### Entregáveis
- 2 guias de conteúdo editorial
- Comparativos automáticos entre produtos
- Dark mode funcional
- Ranking semanal público
- Newsletter automática

---

## 📊 Resumo de Dependências

```
Fase 1 (Fundação)
  └── Fase 2 (Home + Usuário)
        └── Fase 3 (IA)
              ├── Fase 4 (Promoções)
              └── Fase 5 (Crescimento)
```

## ⚠️ Regras de Implementação

1. **Uma fase por vez** — só avançar após aprovação
2. **Testar antes de avançar** — `npm run build` deve passar
3. **Manter compatibilidade** — nada de breaking changes sem aviso
4. **Atualizar CHANGELOG.md** a cada fase concluída
5. **Documentar decisões** — explicar o "porquê" de cada mudança

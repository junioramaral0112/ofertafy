/**
 * OFFER DISCOVERY ENGINE
 *
 * Centraliza a descoberta de ofertas combinando múltiplas estratégias:
 *   1. Termos de produto (busca direta)
 *   2. Termos promocionais (ofertas, cupons, flash deals)
 *   3. Categorias prioritárias (mais vendidos, maior desconto)
 *   4. Score de qualidade (validação + ranking)
 *
 * NAO altera scrapers existentes — apenas adiciona termos e filtros.
 */

// ═══════════════════════════════════════════════════════════
// TERMOS PROMOCIONAIS — adicionados a cada scraper
// ═══════════════════════════════════════════════════════════

export const PROMOTIONAL_TERMS = [
  "oferta do dia",
  "ofertas relampago",
  "promocao",
  "desconto",
  "cupom",
  "cupom de desconto",
  "frete gratis",
  "preco baixou",
  "mais vendidos",
  "campeoes de venda",
  "escolha do cliente",
  "top ofertas",
  "outlet",
  "liquidacao",
  "imperdivel",
  "oferta limitada",
  "lancamento",
  "melhor preco",
  "flash sale",
  "lightning deal",
];

// ═══════════════════════════════════════════════════════════
// CATEGORIAS PRIORITARIAS — termos de alta intenção de compra
// ═══════════════════════════════════════════════════════════

export const PRIORITY_TERMS = [
  // ELETRONICOS
  "celular", "smartphone", "iphone", "iphone 16", "iphone 15",
  "samsung galaxy", "samsung s24", "xiaomi", "xiaomi redmi", "motorola",
  "smart tv", "tv 4k", "tv oled", "tv qled", "samsung tv 50",
  "lg tv 55", "tcl tv", "notebook", "notebook gamer", "notebook dell",
  "notebook lenovo", "notebook acer", "monitor gamer", "monitor 27",
  "fone bluetooth", "fone de ouvido", "headset gamer", "airpods",
  "smartwatch", "apple watch", "videogame", "ps5", "xbox series",
  "nintendo switch", "controle ps5",

  // CASA E ELETRODOMESTICOS
  "air fryer", "fritadeira eletrica", "cafeteira", "cafeteira nespresso",
  "aspirador de po", "aspirador robo", "robo aspirador", "geladeira",
  "geladeira frost free", "geladeira inverter", "fogao", "fogao cooktop",
  "microondas", "micro-ondas", "maquina de lavar", "maquina lava e seca",
  "liquidificador", "climatizador", "ventilador", "ar condicionado",

  // MODA E BELEZA
  "vestido", "vestido festa", "blusa feminina", "calca feminina",
  "calca jeans", "tenis feminino", "tenis masculino", "tenis nike",
  "tenis adidas", "camisa masculina", "camiseta", "perfume",
  "perfume importado", "maquiagem", "bolsa feminina", "bolsa transversal",
  "relogio", "relogio masculino", "oculos de sol",

  // GAMES
  "ps5", "xbox series x", "nintendo switch oled", "jogo ps5",
  "jogo xbox", "controle xbox", "cadeira gamer",

  // INFORMATICA
  "ssd 1tb", "ssd nvme", "memoria ram 16gb", "placa mae", "fonte pc",
  "gabinete gamer", "teclado mecanico", "mouse gamer", "monitor 144hz",

  // INFANTIL
  "brinquedo", "boneca", "carrinho", "lego", "jogo tabuleiro",
];

// ═══════════════════════════════════════════════════════════
// QUALITY VALIDATION — antes de salvar
// ═══════════════════════════════════════════════════════════

export function validateOffer(offer: {
  title?: string; price?: number; originalPrice?: number;
  imageUrl?: string; url?: string; discountPct?: number;
}): { valid: boolean; reason?: string } {
  // Titulo: minimo 10 caracteres
  if (!offer.title || offer.title.length < 10) {
    return { valid: false, reason: "titulo curto" };
  }
  // Preco: deve ser > 0
  if (!offer.price || offer.price <= 0) {
    return { valid: false, reason: "preco invalido" };
  }
  // Desconto maximo realista (evitar 100% OFF falso)
  if (offer.discountPct && offer.discountPct > 90) {
    return { valid: false, reason: "desconto suspeito" };
  }
  // Preco original deve ser maior que o atual (se existir)
  if (offer.originalPrice && offer.originalPrice <= offer.price) {
    return { valid: false, reason: "preco original inconsistente" };
  }
  // URL deve conter dominio valido
  if (!offer.url || (!offer.url.includes("mercadolivre") && !offer.url.includes("shopee") && !offer.url.includes("magazine") && !offer.url.includes("amazon"))) {
    return { valid: false, reason: "url invalida" };
  }
  // Imagem deve existir
  if (!offer.imageUrl || offer.imageUrl.length < 10) {
    return { valid: false, reason: "sem imagem" };
  }
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════
// ENHANCED RANKING SCORE
// ═══════════════════════════════════════════════════════════

export function calculateEnhancedScore(params: {
  discountPct: number; freeShipping: boolean; isFlash?: boolean;
  isBestSeller?: boolean; salesCount?: number; rating?: number;
  hasCoupon?: boolean; isRecent?: boolean; imageQuality?: number;  // 0-1
  titleQuality?: number;  // 0-1
}): number {
  let score = 0;

  // Desconto (0-40 pts)
  if (params.discountPct >= 70) score += 40;
  else if (params.discountPct >= 50) score += 30;
  else if (params.discountPct >= 30) score += 20;
  else if (params.discountPct >= 15) score += 10;
  else if (params.discountPct >= 5) score += 5;

  // Selos promocionais
  if (params.isFlash) score += 35;
  if (params.isBestSeller) score += 40;
  if (params.hasCoupon) score += 25;
  if (params.freeShipping) score += 20;

  // Volume de vendas (0-40 pts)
  if (params.salesCount) {
    if (params.salesCount >= 50000) score += 40;
    else if (params.salesCount >= 10000) score += 25;
    else if (params.salesCount >= 1000) score += 15;
    else if (params.salesCount >= 100) score += 5;
  }

  // Avaliacao (0-15 pts)
  if (params.rating) {
    if (params.rating >= 4.8) score += 15;
    else if (params.rating >= 4.5) score += 10;
    else if (params.rating >= 4.0) score += 5;
    else if (params.rating < 3.0) score -= 10;  // penalidade
  }

  // Recencia (0-10 pts)
  if (params.isRecent) score += 10;

  // Qualidade dos dados (0-20 pts)
  score += Math.round((params.titleQuality || 0.5) * 10);
  score += Math.round((params.imageQuality || 0.5) * 10);

  return Math.max(0, score);
}

// ═══════════════════════════════════════════════════════════
// TERM MERGER — une termos existentes + promocionais + prioridade
// ═══════════════════════════════════════════════════════════

export function mergeSearchTerms(
  existingTerms: string[],
  options: { includePromo?: boolean; includePriority?: boolean } = {}
): string[] {
  const merged = new Set(existingTerms);

  if (options.includePromo !== false) {
    PROMOTIONAL_TERMS.forEach((t) => merged.add(t));
  }
  if (options.includePriority !== false) {
    PRIORITY_TERMS.forEach((t) => merged.add(t));
  }

  return Array.from(merged);
}

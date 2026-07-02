/**
 * 🏪 ARQUITETURA ESCALÁVEL DE LOJAS — Tipos
 *
 * Cada loja é definida por um StoreConfig.
 * Adicionar uma nova loja = adicionar 1 entrada no registry.
 */

export interface StoreConfig {
  /** Slug único (ex: 'mercadolivre', 'shein', 'aliexpress') */
  slug: string

  /** Nome exibível (ex: 'Mercado Livre', 'SHEIN') */
  name: string

  /** Domínio principal (ex: 'mercadolivre.com.br') */
  domain: string

  /** Cor primária da marca (hex) */
  color: string

  /** Cor do texto sobre a cor primária */
  textColor: string

  /** Emoji/ícone para listagens */
  icon: string

  /** Classe Tailwind para o badge da loja */
  badgeClass: string

  /** Se está ativa (aparece nos filtros e navegação) */
  active: boolean

  /** Reputação para o Índice Ofertafy (0-100) */
  reputation: number

  /** Estratégia de URL de afiliado */
  affiliate: AffiliateStrategy

  /** Categorias suportadas (opcional) */
  categories?: string[]
}

export interface AffiliateStrategy {
  /** Tipo de tracking */
  type: 'query_param' | 'path' | 'subdomain' | 'shortlink' | 'api'

  /** Nome do parâmetro (ex: 'matt_tool', 'tag', 'affiliate_id') */
  paramName?: string

  /** Valor do parâmetro (ex: '35888960', 'ofertafy00-20') */
  paramValue?: string

  /** Prefixo de URL (ex: 'https://www.magazinevoce.com.br/magazine{storeId}') */
  urlPrefix?: string

  /** Função customizada de geração de URL (opcional) */
  customUrlBuilder?: (productUrl: string, config: StoreConfig) => string
}

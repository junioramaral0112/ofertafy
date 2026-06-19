export interface OfferData {
  id: string
  title: string
  description: string | null
  imageUrl: string
  price: number
  originalPrice: number
  discountPct: number
  currency: string
  url: string
  store: string
  storeLabel: string
  category: string
  categorySlug: string
  installment: string | null
  freeShipping: boolean
  isFlash: boolean
  flashEndsAt: Date | string | null
  clicks: number
  likes: number
  sourceId: string | null
  createdAt: Date | string
  updatedAt: Date | string
  priceHistory?: PriceHistoryData[]
}

export interface PriceHistoryData {
  id: string
  offerId: string
  price: number
  checkedAt: Date | string
}

export interface SearchResponse {
  offers: OfferData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FetchResult {
  store: string
  offersFound: number
  offersAdded: number
  offersUpdated: number
  errors: string[]
}

export interface AffiliateConfig {
  // Mercado Livre (principal)
  mlMattTool: string

  // Magalu (principal)
  magaluStoreId: string

  // Shopee (API oficial de afiliados)
  shopeeAppId?: string
  shopeeSecret?: string

  // TikTok Shop (API de Afiliados)
  tiktokAffiliateId?: string
  tiktokAccessToken?: string

  // Amazon (adormecida — ativa quando preencher)
  amazonAssociateTag?: string
  amazonAccessKey?: string
  amazonSecretKey?: string
}

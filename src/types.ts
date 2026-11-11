export type ListingType = 'goods' | 'services'

export interface Seller {
  name: string
  r: number
  n: number
  hall: string
}

export interface Listing {
  id: number
  t: string
  p: number
  unit?: string
  cond: string
  cat: string
  type: ListingType
  sellerId: string
  d: string
  spots: string[]
  createdAt: string
  photos: string[]
}

export interface Pickup {
  spot: string
  day: string
  time: string
}

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'superseded'

export interface Msg {
  id: number
  threadId: number
  sender: string | null // null = system note
  kind: 'text' | 'offer' | 'system'
  body: string
  amount?: number
  offerStatus?: OfferStatus
  createdAt: string
}

export interface ThreadPickup {
  spot: string
  day: string
  time: string
  status: 'proposed' | 'accepted'
  by: string | null
}

export interface Thread {
  id: number
  listingId: number
  buyerId: string
  sellerId: string
  status: 'open' | 'agreed' | 'completed'
  agreed?: number
  pickup?: ThreadPickup
  buyerReadAt: string
  sellerReadAt: string
  createdAt: string
}

export type Screen =
  | 'login'
  | 'home'
  | 'detail'
  | 'chat'
  | 'schedule'
  | 'confirm'
  | 'rate'
  | 'post'
  | 'messages'
  | 'profile'

export type Sheet = 'filter' | 'offer' | 'report' | 'remove' | null

export interface Filters {
  max: number
  cond: string[]
  sort: 'new' | 'low' | 'high'
}

export interface PostDraft {
  title: string
  price: string
  type: ListingType
  unit: string
  cat: string
  cond: string
  spot: string
  desc: string
}

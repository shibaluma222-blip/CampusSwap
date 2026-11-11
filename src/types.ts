export type ListingType = 'goods' | 'services'

export interface Seller {
  name: string
  r: number
  n: number
  hall: string
  admin?: boolean
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
  status: 'active' | 'sold' | 'removed'
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
  handoverAt?: string
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
  | 'admin'
  | 'saved'
  | 'settings'
  | 'editProfile'
  | 'password'
  | 'info'

export type Sheet = 'filter' | 'offer' | 'report' | 'reportReason' | 'block' | 'blocked' | 'remove' | 'deleteAccount' | null

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

export type ReportReason = 'spam' | 'scam' | 'prohibited' | 'harassment' | 'other'

export interface Report {
  id: number
  reporterId: string
  reportedUserId: string
  listingId?: number
  reason: ReportReason
  details: string
  status: 'open' | 'resolved' | 'dismissed'
  adminNote: string
  createdAt: string
}

export type InfoKey = 'safety' | 'help' | 'terms'

import type { IconName } from './icons'

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

export interface Msg {
  ts: string
  w?: 'me' | 'them'
  t?: string
  offer?: number
  sys?: boolean
  icon?: IconName
  card?: boolean
}

export interface Chat {
  msgs: Msg[]
  unread: number
  agreed?: number
  pickup?: Pickup
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

export type Sheet = 'filter' | 'offer' | 'report' | null

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

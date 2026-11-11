import { supabase } from './supabase'
import type { Listing, ListingType, Msg, PostDraft, Seller, Thread } from './types'

interface ListingRow {
  id: number
  title: string
  price: number
  unit: string | null
  type: ListingType
  category: string
  condition: string
  description: string
  spots: string[]
  created_at: string
  seller_id: string
  listing_photos: { path: string; position: number }[]
}
interface ProfileRow {
  id: string
  display_name: string
  hall: string | null
  rating_avg: number | string
  trades_count: number
}

const BUCKET = 'listing-photos'
export const photoUrl = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

export async function fetchAll(uid: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('id,title,price,unit,type,category,condition,description,spots,created_at,seller_id,listing_photos(path,position)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as unknown as ListingRow[]
  const ids = [...new Set([...rows.map((r) => r.seller_id), uid])]
  const [pf, fv] = await Promise.all([
    supabase.from('profiles').select('id,display_name,hall,rating_avg,trades_count').in('id', ids),
    supabase.from('favourites').select('listing_id').eq('user_id', uid),
  ])
  if (pf.error) throw pf.error
  if (fv.error) throw fv.error
  const sellers: Record<string, Seller> = {}
  for (const p of (pf.data ?? []) as ProfileRow[]) {
    sellers[p.id] = { name: p.display_name, r: Number(p.rating_avg), n: p.trades_count, hall: p.hall ?? '' }
  }
  const listings: Listing[] = rows.map((r) => ({
    id: r.id,
    t: r.title,
    p: r.price,
    unit: r.unit ?? undefined,
    cond: r.condition,
    cat: r.category,
    type: r.type,
    sellerId: r.seller_id,
    d: r.description,
    spots: r.spots,
    createdAt: r.created_at,
    photos: [...r.listing_photos].sort((a, b) => a.position - b.position).map((p) => photoUrl(p.path)),
  }))
  const fav = ((fv.data ?? []) as { listing_id: number }[]).map((f) => f.listing_id)
  return { listings, sellers, fav }
}

export async function setFavourite(uid: string, listingId: number, on: boolean) {
  const q = on
    ? supabase.from('favourites').insert({ user_id: uid, listing_id: listingId })
    : supabase.from('favourites').delete().eq('user_id', uid).eq('listing_id', listingId)
  const { error } = await q
  if (error) throw error
}

// Phone photos are 3-6 MB: shrink to max 1280px JPEG before upload (bucket limit is 2 MB).
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not process image'))), 'image/jpeg', 0.8))
}

export async function createListing(uid: string, d: PostDraft, files: File[]) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: uid,
      title: d.title.trim(),
      price: Number(d.price),
      unit: d.type === 'services' && d.unit ? d.unit : null,
      type: d.type,
      category: d.cat,
      condition: d.type === 'services' ? 'Service' : d.cond,
      description: d.desc.trim(),
      spots: [d.spot],
    })
    .select('id')
    .single()
  if (error) throw error
  const id = (data as { id: number }).id
  for (const [i, f] of files.entries()) {
    const path = `${uid}/${id}/${crypto.randomUUID()}.jpg`
    const up = await supabase.storage.from(BUCKET).upload(path, await shrink(f), { contentType: 'image/jpeg' })
    if (up.error) throw up.error
    const ph = await supabase.from('listing_photos').insert({ listing_id: id, path, position: i })
    if (ph.error) throw ph.error
  }
  return id
}

export async function removeListing(id: number) {
  const { error } = await supabase.from('listings').update({ status: 'removed' }).eq('id', id)
  if (error) throw error
}

// ---------- chat ----------
export interface MsgRow {
  id: number
  thread_id: number
  sender_id: string | null
  kind: 'text' | 'offer' | 'system'
  body: string
  amount: number | null
  offer_status: Msg['offerStatus'] | null
  created_at: string
}
export interface ThreadRow {
  id: number
  listing_id: number
  buyer_id: string
  seller_id: string
  status: Thread['status']
  agreed_price: number | null
  pickup_spot: string | null
  pickup_day: string | null
  pickup_time: string | null
  pickup_status: 'none' | 'proposed' | 'accepted'
  pickup_by: string | null
  buyer_read_at: string
  seller_read_at: string
  created_at: string
}

export const mapMsg = (r: MsgRow): Msg => ({
  id: r.id,
  threadId: r.thread_id,
  sender: r.sender_id,
  kind: r.kind,
  body: r.body,
  amount: r.amount ?? undefined,
  offerStatus: r.offer_status ?? undefined,
  createdAt: r.created_at,
})

export const mapThread = (r: ThreadRow): Thread => ({
  id: r.id,
  listingId: r.listing_id,
  buyerId: r.buyer_id,
  sellerId: r.seller_id,
  status: r.status,
  agreed: r.agreed_price ?? undefined,
  pickup:
    r.pickup_status === 'none' || !r.pickup_spot
      ? undefined
      : { spot: r.pickup_spot, day: r.pickup_day ?? '', time: r.pickup_time ?? '', status: r.pickup_status, by: r.pickup_by },
  buyerReadAt: r.buyer_read_at,
  sellerReadAt: r.seller_read_at,
  createdAt: r.created_at,
})

export async function fetchThreads(uid: string) {
  const [th, ms] = await Promise.all([
    supabase.from('threads').select('*').order('created_at', { ascending: false }),
    supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(1000),
  ])
  if (th.error) throw th.error
  if (ms.error) throw ms.error
  const threads = ((th.data ?? []) as unknown as ThreadRow[]).map(mapThread)
  const msgs: Record<number, Msg[]> = {}
  for (const r of (ms.data ?? []) as unknown as MsgRow[]) (msgs[r.thread_id] ??= []).push(mapMsg(r))
  const others = [...new Set(threads.map((t) => (t.buyerId === uid ? t.sellerId : t.buyerId)))]
  const profiles: Record<string, Seller> = {}
  if (others.length) {
    const pf = await supabase.from('profiles').select('id,display_name,hall,rating_avg,trades_count').in('id', others)
    if (pf.error) throw pf.error
    for (const p of (pf.data ?? []) as ProfileRow[]) {
      profiles[p.id] = { name: p.display_name, r: Number(p.rating_avg), n: p.trades_count, hall: p.hall ?? '' }
    }
  }
  return { threads, msgs, profiles }
}

async function rpc<T>(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

export const startThread = (listingId: number) => rpc<number>('start_thread', { p_listing: listingId })
export const sendOfferRpc = (threadId: number, amount: number) => rpc<number>('send_offer', { p_thread: threadId, p_amount: amount })
export const respondOfferRpc = (messageId: number, accept: boolean) => rpc<null>('respond_offer', { p_message: messageId, p_accept: accept })
export const proposePickupRpc = (threadId: number, spot: string, day: string, time: string) =>
  rpc<null>('propose_pickup', { p_thread: threadId, p_spot: spot, p_day: day, p_time: time })
export const acceptPickupRpc = (threadId: number) => rpc<null>('accept_pickup', { p_thread: threadId })
export const markReadRpc = (threadId: number) => rpc<null>('mark_read', { p_thread: threadId })

export async function sendText(uid: string, threadId: number, body: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: uid, kind: 'text', body: body.slice(0, 1000) })
    .select('*')
    .single()
  if (error) throw error
  return mapMsg(data as unknown as MsgRow)
}

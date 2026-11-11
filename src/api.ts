import { supabase } from './supabase'
import type { Listing, ListingType, PostDraft, Seller } from './types'

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

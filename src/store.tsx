import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createListing, fetchAll, removeListing, setFavourite } from './api'
import { ALLOWED_EMAIL, CATS, money, now } from './data'
import { supabase } from './supabase'
import type { Chat, Filters, Listing, ListingType, Msg, Pickup, PostDraft, Screen, Seller, Sheet } from './types'

export interface State {
  screen: Screen
  hist: Screen[]
  email: string
  userId: string | null
  otpStage: boolean
  emailErr: boolean
  type: ListingType
  cat: string
  q: string
  F: Filters
  fav: number[]
  cur: number
  sheet: Sheet
  toast: string | null
  chats: Record<number, Chat>
  pickup: Pickup
  handover: boolean
  rate: number
  rateTags: string[]
  typing: boolean
  post: PostDraft
  listings: Listing[]
  sellers: Record<string, Seller>
  loading: boolean
  posting: boolean
}

const DEFAULT_FILTERS: Filters = { max: 5000, cond: [], sort: 'new' }
const EMPTY_POST: PostDraft = { title: '', price: '', type: 'goods', unit: '', cat: 'Furniture', cond: 'Good', spot: 'Hall Lobby', desc: '' }
const UNKNOWN_SELLER: Seller = { name: 'Unknown', r: 0, n: 0, hall: '' }

const initial = (): State => ({
  screen: 'login',
  hist: [],
  email: '',
  userId: null,
  otpStage: false,
  emailErr: false,
  type: 'goods',
  cat: 'All',
  q: '',
  F: DEFAULT_FILTERS,
  fav: [],
  cur: 0,
  sheet: null,
  toast: null,
  chats: {},
  pickup: { spot: 'Hall Lobby', day: 'Fri', time: '15:00' },
  handover: false,
  rate: 0,
  rateTags: [],
  typing: false,
  post: EMPTY_POST,
  listings: [],
  sellers: {},
  loading: false,
  posting: false,
})

export function useAppState() {
  const [s, setS] = useState<State>(initial)
  const ref = useRef(s)
  useLayoutEffect(() => {
    ref.current = s
  })
  const toastTimer = useRef<number | undefined>(undefined)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach(clearTimeout)
      clearTimeout(toastTimer.current)
    }
  }, [])

  const patch = useCallback((p: Partial<State>) => setS((x) => ({ ...x, ...p })), [])

  const A = useMemo(() => {
    const toast = (t: string) => {
      setS((x) => ({ ...x, toast: t }))
      clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setS((x) => ({ ...x, toast: null })), 1900)
    }
    const later = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms))
    }
    const go = (screen: Screen, replace = false) =>
      setS((x) => ({
        ...x,
        hist: replace || x.screen === screen ? x.hist : [...x.hist, x.screen],
        screen,
        sheet: null,
      }))
    const back = () => setS((x) => ({ ...x, screen: x.hist[x.hist.length - 1] ?? 'home', hist: x.hist.slice(0, -1), sheet: null }))
    const tab = (screen: Screen) => setS((x) => ({ ...x, hist: [], screen, sheet: null }))

    const setChat = (id: number, fn: (c: Chat) => Chat) =>
      setS((x) => ({ ...x, chats: { ...x.chats, [id]: fn(x.chats[id] ?? { msgs: [], unread: 0 }) } }))
    const pushMsg = (id: number, m: Omit<Msg, 'ts'>) => setChat(id, (c) => ({ ...c, msgs: [...c.msgs, { ts: now(), ...m }] }))
    const sellerReply = (ms: number, fn: () => void) => {
      setS((x) => ({ ...x, typing: true }))
      later(ms, () => {
        setS((x) => ({ ...x, typing: false }))
        fn()
      })
    }
    const listing = (id: number) => ref.current.listings.find((l) => l.id === id)

    const loadData = async (uid: string) => {
      setS((x) => ({ ...x, loading: true }))
      try {
        const d = await fetchAll(uid)
        setS((x) => ({ ...x, listings: d.listings, sellers: d.sellers, fav: d.fav, loading: false }))
      } catch (e) {
        setS((x) => ({ ...x, loading: false }))
        toast(e instanceof Error ? e.message : 'Could not load listings')
      }
    }

    return {
      toast,
      go,
      back,
      tab,
      loadData,
      async sendCode(email: string) {
        const em = email.trim().toLowerCase()
        if (!ALLOWED_EMAIL.test(em)) return setS((x) => ({ ...x, email: em, emailErr: true }))
        setS((x) => ({ ...x, email: em, emailErr: false }))
        const { error } = await supabase.auth.signInWithOtp({ email: em, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } })
        if (error) return toast(error.message)
        setS((x) => ({ ...x, otpStage: true }))
      },
      async verifyCode(email: string, code: string) {
        const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' })
        if (error) {
          toast('Invalid or expired code')
          return false
        }
        setS((x) => ({ ...x, otpStage: false, hist: [], screen: 'home' }))
        toast('Verified. Welcome to CampusSwap')
        return true
      },
      async passwordLogin(email: string, password: string) {
        const em = email.trim().toLowerCase()
        const { error } = await supabase.auth.signInWithPassword({ email: em, password })
        if (error) return toast('Wrong email or password')
        setS((x) => ({ ...x, email: em, hist: [], screen: 'home' }))
      },
      logout() {
        void supabase.auth.signOut()
        setS(() => initial())
      },
      toggleFav(id: number) {
        const { userId, fav } = ref.current
        if (!userId) return
        const on = !fav.includes(id)
        setS((x) => ({ ...x, fav: on ? [...x.fav, id] : x.fav.filter((i) => i !== id) }))
        setFavourite(userId, id, on).catch(() => {
          setS((x) => ({ ...x, fav: on ? x.fav.filter((i) => i !== id) : [...x.fav, id] }))
          toast('Could not update favourites')
        })
      },
      openListing(id: number) {
        patch({ cur: id })
        go('detail')
      },
      startChat() {
        setChat(ref.current.cur, (c) => c)
        go('chat')
      },
      openChat(id: number) {
        setS((x) => ({ ...x, cur: id }))
        setChat(id, (c) => ({ ...c, unread: 0 }))
        go('chat')
      },
      setSheet: (sheet: Sheet) => patch({ sheet }),
      sendMsg(txt: string) {
        const id = ref.current.cur
        pushMsg(id, { w: 'me', t: txt })
        sellerReply(1100, () =>
          pushMsg(id, { w: 'them', t: /available|still/i.test(txt) ? 'Yes, it is still available!' : 'Sure! Lobby pickup works for me.' }),
        )
      },
      sendOffer(raw: string) {
        const id = ref.current.cur
        const x = listing(id)
        const v = parseInt(raw)
        if (!x || !v || v <= 0) return toast('Enter a valid amount')
        patch({ sheet: null })
        pushMsg(id, { w: 'me', offer: v })
        sellerReply(1300, () => {
          if (v >= x.p * 0.8) {
            setChat(id, (c) => ({ ...c, agreed: v }))
            pushMsg(id, { w: 'them', t: `Deal at ${money(v)}. Let's set a pickup time.` })
            pushMsg(id, { card: true })
          } else {
            pushMsg(id, { w: 'them', t: `That's a bit low. Could you do ${money(Math.ceil((x.p * 0.9) / 10) * 10)}?` })
          }
        })
      },
      setPickup: (p: Partial<Pickup>) => setS((x) => ({ ...x, pickup: { ...x.pickup, ...p } })),
      confirmPickup() {
        const { cur: id, pickup: p } = ref.current
        pushMsg(id, { sys: true, t: `Pickup proposed: ${p.day} ${p.time}, ${p.spot}` })
        setS((x) => ({ ...x, screen: 'chat', hist: x.hist.slice(0, -1) }))
        sellerReply(1400, () => {
          setChat(id, (c) => ({ ...c, pickup: { ...p } }))
          pushMsg(id, { sys: true, icon: 'check', t: 'Seller accepted the pickup time' })
          pushMsg(id, { w: 'them', t: 'Works for me. See you in the lobby!' })
        })
      },
      simulateScan() {
        patch({ handover: true })
        toast('Seller scanned your QR')
      },
      setRate: (rate: number) => patch({ rate }),
      toggleRateTag: (t: string) => setS((x) => ({ ...x, rateTags: x.rateTags.includes(t) ? x.rateTags.filter((i) => i !== t) : [...x.rateTags, t] })),
      submitRate() {
        setS((x) => ({ ...x, rate: 0, rateTags: [], handover: false, hist: [], screen: 'home', sheet: null }))
        toast('Thanks! Rating submitted')
      },
      setPost(p: Partial<PostDraft>) {
        setS((x) => {
          const post = { ...x.post, ...p }
          if (p.type && p.type !== x.post.type) {
            post.cat = CATS[p.type][1]
            post.cond = p.type === 'services' ? 'Service' : 'Good'
            post.unit = p.type === 'services' ? '/hr' : ''
          }
          return { ...x, post }
        })
      },
      async publish(files: File[]): Promise<boolean> {
        const { post: p, userId } = ref.current
        if (!userId) return false
        if (!p.title.trim() || !+p.price) {
          toast('Add a title and price')
          return false
        }
        setS((x) => ({ ...x, posting: true }))
        try {
          await createListing(userId, p, files)
          await loadData(userId)
          setS((x) => ({ ...x, posting: false, post: EMPTY_POST, hist: [], screen: 'home', type: p.type, cat: 'All' }))
          toast('Listing posted')
          return true
        } catch (e) {
          setS((x) => ({ ...x, posting: false }))
          toast(e instanceof Error ? e.message : 'Could not post listing')
          return false
        }
      },
      async removeListing(id: number) {
        try {
          await removeListing(id)
          setS((x) => ({ ...x, listings: x.listings.filter((l) => l.id !== id), hist: [], screen: 'home' }))
          toast('Listing removed')
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Could not remove listing')
        }
      },
      setType: (type: ListingType) => patch({ type, cat: 'All' }),
      resetFilters: () => patch({ F: DEFAULT_FILTERS }),
    }
  }, [patch])

  // Session handling: restores a saved session on reload, follows sign in and out.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setS((x) => ({
        ...x,
        userId: u?.id ?? null,
        email: u?.email ?? x.email,
        screen: u && x.screen === 'login' ? 'home' : x.screen,
      }))
      // defer: supabase calls must not run inside the auth callback
      if (u) window.setTimeout(() => void A.loadData(u.id), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [A])

  return { s, patch, A }
}

export type Actions = ReturnType<typeof useAppState>['A']
interface Ctx {
  s: State
  patch: (p: Partial<State>) => void
  A: Actions
}
const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const v = useAppState()
  return <AppCtx.Provider value={v}>{children}</AppCtx.Provider>
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}

export const sellerOf = (s: State, l: Listing): Seller => s.sellers[l.sellerId] ?? UNKNOWN_SELLER

export function useFiltered() {
  const { s } = useApp()
  let r = s.listings.filter((x) => x.type === s.type)
  if (s.cat !== 'All') r = r.filter((x) => x.cat === s.cat)
  if (s.q) {
    const q = s.q.toLowerCase()
    r = r.filter((x) => (x.t + x.cat + (s.sellers[x.sellerId]?.name ?? '')).toLowerCase().includes(q))
  }
  r = r.filter((x) => x.p <= s.F.max)
  if (s.F.cond.length) r = r.filter((x) => s.F.cond.includes(x.cond))
  if (s.F.sort === 'low') r = [...r].sort((a, b) => a.p - b.p)
  if (s.F.sort === 'high') r = [...r].sort((a, b) => b.p - a.p)
  return r
}

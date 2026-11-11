import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import { CITYU_EMAIL, money, now, SEED_LISTINGS, SELLERS } from './data'
import type { Chat, Filters, Listing, ListingType, Msg, Pickup, PostDraft, Screen, Sheet } from './types'

export interface State {
  screen: Screen
  hist: Screen[]
  email: string
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
}

const DEFAULT_FILTERS: Filters = { max: 5000, cond: [], sort: 'new' }
const EMPTY_POST: PostDraft = { title: '', price: '', cat: 'Furniture', cond: 'Good', spot: 'Hall Lobby', desc: '' }

const initial = (): State => ({
  screen: 'login',
  hist: [],
  email: '',
  otpStage: false,
  emailErr: false,
  type: 'goods',
  cat: 'All',
  q: '',
  F: DEFAULT_FILTERS,
  fav: [],
  cur: 1,
  sheet: null,
  toast: null,
  chats: {
    3: {
      msgs: [
        { w: 'me', t: 'Hi! Is the battery still at 87%?', ts: 'Yesterday' },
        { w: 'them', t: 'Yes, I checked this morning.', ts: 'Yesterday' },
        { w: 'them', t: 'Happy to let you test it in the lobby.', ts: 'Yesterday' },
      ],
      unread: 1,
    },
    4: {
      msgs: [
        { w: 'me', t: 'Can I pick it up tonight?', ts: '9:12 AM' },
        { w: 'them', t: "Sure, I'm at the lobby after 7.", ts: '9:30 AM' },
      ],
      unread: 0,
    },
  },
  pickup: { spot: 'Hall Lobby', day: 'Fri', time: '15:00' },
  handover: false,
  rate: 0,
  rateTags: [],
  typing: false,
  post: EMPTY_POST,
  listings: SEED_LISTINGS,
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

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email
      if (email) setS((x) => (x.screen === 'login' ? { ...x, email, screen: 'home' } : x))
    })
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

    return {
      toast,
      go,
      back,
      tab,
      async sendCode(email: string) {
        const em = email.trim().toLowerCase()
        if (!CITYU_EMAIL.test(em)) return setS((x) => ({ ...x, email: em, emailErr: true }))
        setS((x) => ({ ...x, email: em, emailErr: false }))
        if (supabase) {
          const { error } = await supabase.auth.signInWithOtp({ email: em, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } })
          if (error) return toast(error.message)
        }
        setS((x) => ({ ...x, otpStage: true }))
      },
      async verifyCode(email: string, code: string) {
        if (supabase) {
          const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' })
          if (error) {
            toast('Invalid or expired code')
            return false
          }
        }
        setS((x) => ({ ...x, otpStage: false, hist: [], screen: 'home' }))
        toast('Verified. Welcome to CampusSwap')
        return true
      },
      logout() {
        void supabase?.auth.signOut()
        setS((x) => ({ ...x, screen: 'login', hist: [], otpStage: false, email: '' }))
      },
      toggleFav: (id: number) => setS((x) => ({ ...x, fav: x.fav.includes(id) ? x.fav.filter((i) => i !== id) : [...x.fav, id] })),
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
      setPost: (p: Partial<PostDraft>) => setS((x) => ({ ...x, post: { ...x.post, ...p } })),
      publish() {
        const p = ref.current.post
        if (!p.title.trim() || !+p.price) return toast('Add a title and price')
        const l: Listing = {
          id: Date.now() % 100000,
          t: p.title.trim(),
          p: +p.price,
          cond: p.cond,
          cat: p.cat,
          type: 'goods',
          s: 'alex',
          mine: true,
          d: p.desc || 'No description.',
          spots: [p.spot],
          age: 'Just now',
        }
        setS((x) => ({ ...x, listings: [l, ...x.listings], post: EMPTY_POST, hist: [], screen: 'home', type: 'goods', cat: 'All' }))
        toast('Listing posted')
      },
      setType: (type: ListingType) => patch({ type, cat: 'All' }),
      resetFilters: () => patch({ F: DEFAULT_FILTERS }),
    }
  }, [patch])

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

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFiltered() {
  const { s } = useApp()
  let r = s.listings.filter((x) => x.type === s.type)
  if (s.cat !== 'All') r = r.filter((x) => x.cat === s.cat)
  if (s.q) r = r.filter((x) => (x.t + x.cat + SELLERS[x.s].name).toLowerCase().includes(s.q.toLowerCase()))
  r = r.filter((x) => x.p <= s.F.max)
  if (s.F.cond.length) r = r.filter((x) => s.F.cond.includes(x.cond))
  if (s.F.sort === 'low') r = [...r].sort((a, b) => a.p - b.p)
  if (s.F.sort === 'high') r = [...r].sort((a, b) => b.p - a.p)
  return r
}

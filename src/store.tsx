import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  acceptPickupRpc, blockUser, confirmHandoverRpc, createListing, deleteAccountRpc, fetchAll, fetchReports, fetchThreads, mapMsg, mapThread, markReadRpc, proposePickupRpc,
  removeListing, resolveReportRpc, respondOfferRpc, sendOfferRpc, sendText, setFavourite, startThread, submitRatingRpc, submitReportRpc, unblockUser, updateProfile,
  type MsgRow, type ThreadRow,
} from './api'
import { ALLOWED_EMAIL, CATS, isDemoEmail } from './data'
import { supabase } from './supabase'
import type { Filters, InfoKey, Listing, ListingType, Msg, Pickup, PostDraft, Report, ReportReason, Screen, Seller, Sheet, Thread } from './types'

export interface State {
  screen: Screen
  hist: Screen[]
  email: string
  userId: string | null
  hasPw: boolean
  otpStage: boolean
  emailErr: boolean
  type: ListingType
  cat: string
  q: string
  F: Filters
  fav: number[]
  cur: number // listing being viewed
  curThread: number | null // open conversation
  sheet: Sheet
  toast: string | null
  threads: Thread[]
  msgs: Record<number, Msg[]>
  pickup: Pickup // draft shown on the Schedule screen
  rated: number[] // threads I already rated
  rate: number
  rateTags: string[]
  post: PostDraft
  listings: Listing[]
  sellers: Record<string, Seller> // every profile we have seen (sellers and chat partners)
  loading: boolean
  posting: boolean
  blocked: string[] // users I blocked
  reports: Report[] // admin only
  reportReason: ReportReason | null
  reportDetails: string
  info: InfoKey
}

const DEFAULT_FILTERS: Filters = { max: 5000, cond: [], sort: 'new' }
const EMPTY_POST: PostDraft = { title: '', price: '', type: 'goods', unit: '', cat: 'Furniture', cond: 'Good', spot: 'Hall Lobby', desc: '' }
const UNKNOWN_SELLER: Seller = { name: 'Unknown', r: 0, n: 0, hall: '' }

const initial = (): State => ({
  screen: 'login',
  hist: [],
  email: '',
  userId: null,
  hasPw: false,
  otpStage: false,
  emailErr: false,
  type: 'goods',
  cat: 'All',
  q: '',
  F: DEFAULT_FILTERS,
  fav: [],
  cur: 0,
  curThread: null,
  sheet: null,
  toast: null,
  threads: [],
  msgs: {},
  pickup: { spot: 'Hall Lobby', day: 'Fri', time: '15:00' },
  rated: [],
  rate: 0,
  rateTags: [],
  post: EMPTY_POST,
  listings: [],
  sellers: {},
  loading: true, // true until the first data load finishes, so lists show Loading instead of empty
  posting: false,
  blocked: [],
  reports: [],
  reportReason: null,
  reportDetails: '',
  info: 'safety',
})

const errText = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : fallback

const byTime = (a: Msg, b: Msg) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id

export function useAppState() {
  const [s, setS] = useState<State>(initial)
  const ref = useRef(s)
  const sendingRef = useRef(false)
  useLayoutEffect(() => {
    ref.current = s
  })
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const patch = useCallback((p: Partial<State>) => setS((x) => ({ ...x, ...p })), [])

  const A = useMemo(() => {
    const toast = (t: string) => {
      setS((x) => ({ ...x, toast: t }))
      clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setS((x) => ({ ...x, toast: null })), 2200)
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
    const fail = (e: unknown, fallback = 'Something went wrong') => toast(errText(e, fallback))

    const loadListings = async (uid: string) => {
      const d = await fetchAll(uid)
      setS((x) => ({ ...x, listings: d.listings, sellers: { ...x.sellers, ...d.sellers }, fav: d.fav, blocked: d.blocked }))
    }
    const refreshThreads = async () => {
      const uid = ref.current.userId
      if (!uid) return
      try {
        const d = await fetchThreads(uid)
        setS((x) => ({ ...x, threads: d.threads, msgs: d.msgs, rated: d.rated, sellers: { ...x.sellers, ...d.profiles } }))
      } catch {
        // transient network errors are retried by the next poll
      }
    }
    const markRead = async (threadId: number) => {
      try {
        await markReadRpc(threadId)
        await refreshThreads()
      } catch {
        /* ignore */
      }
    }
    const isViewing = (threadId: number) => ref.current.screen === 'chat' && ref.current.curThread === threadId

    const loadData = async (uid: string) => {
      setS((x) => ({ ...x, loading: true }))
      try {
        await Promise.all([loadListings(uid), refreshThreads()])
      } catch (e) {
        fail(e, 'Could not load listings')
      }
      setS((x) => ({ ...x, loading: false }))
    }

    const A_loadReports = async () => {
      try {
        const d = await fetchReports()
        setS((x) => ({ ...x, reports: d.reports, sellers: { ...x.sellers, ...d.profiles } }))
      } catch (e) {
        fail(e, 'Could not load reports')
      }
    }

    const upsertMsg = (m: Msg) =>
      setS((x) => {
        const list = x.msgs[m.threadId] ?? []
        const next = list.some((i) => i.id === m.id) ? list.map((i) => (i.id === m.id ? m : i)) : [...list, m].sort(byTime)
        return { ...x, msgs: { ...x.msgs, [m.threadId]: next } }
      })

    return {
      toast,
      go,
      back,
      tab,
      loadData,
      refreshThreads,
      async sendCode(email: string): Promise<boolean> {
        const em = email.trim().toLowerCase()
        if (!ALLOWED_EMAIL.test(em)) {
          setS((x) => ({ ...x, email: em, emailErr: true }))
          return false
        }
        // One request at a time. Two parallel requests for a new user collide in the database, and each new code replaces the previous one.
        if (sendingRef.current) return false
        sendingRef.current = true
        try {
          setS((x) => ({ ...x, email: em, emailErr: false }))
          const { error } = await supabase.auth.signInWithOtp({ email: em, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } })
          if (error) {
            toast(error.message)
            return false
          }
          setS((x) => ({ ...x, otpStage: true }))
          return true
        } finally {
          sendingRef.current = false
        }
      },
      async verifyCode(email: string, code: string) {
        const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' })
        if (error) {
          toast('Wrong or old code. Only the newest email works')
          return false
        }
        // First time on this account: offer to set a password so the next login needs no email code.
        const needPw = !data.user?.user_metadata?.has_pw && !isDemoEmail(email)
        setS((x) => ({ ...x, otpStage: false, hist: needPw ? ['home'] : [], screen: needPw ? 'password' : 'home' }))
        toast('Verified. Welcome to CampusSwap')
        return true
      },
      async passwordLogin(email: string, password: string) {
        const em = email.trim().toLowerCase()
        if (!ALLOWED_EMAIL.test(em)) return setS((x) => ({ ...x, email: em, emailErr: true }))
        const { error } = await supabase.auth.signInWithPassword({ email: em, password })
        if (error) return toast('Wrong email or password')
        setS((x) => ({ ...x, email: em, hist: [], screen: 'home' }))
      },
      async savePassword(password: string): Promise<boolean> {
        const { error } = await supabase.auth.updateUser({ password, data: { has_pw: true } })
        if (error) {
          toast(error.message)
          return false
        }
        toast('Password saved. You can sign in with it next time')
        return true
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

      // ----- chat -----
      async startChat() {
        try {
          const tid = await startThread(ref.current.cur)
          await refreshThreads()
          patch({ curThread: tid })
          go('chat')
          void markRead(tid)
        } catch (e) {
          fail(e, 'Could not open chat')
        }
      },
      openThread(tid: number) {
        const t = ref.current.threads.find((i) => i.id === tid)
        if (!t) return
        setS((x) => ({ ...x, cur: t.listingId, curThread: tid }))
        go('chat')
        void markRead(tid)
      },
      setSheet: (sheet: Sheet) => patch({ sheet }),
      async sendMsg(txt: string) {
        const { userId, curThread } = ref.current
        if (!userId || !curThread) return
        try {
          upsertMsg(await sendText(userId, curThread, txt))
        } catch (e) {
          fail(e, 'Message not sent')
        }
      },
      async sendOffer(raw: string) {
        const tid = ref.current.curThread
        const v = parseInt(raw)
        if (!tid || !v || v <= 0) return toast('Enter a valid amount')
        patch({ sheet: null })
        try {
          await sendOfferRpc(tid, v)
          await refreshThreads()
        } catch (e) {
          fail(e, 'Offer not sent')
        }
      },
      async respondOffer(messageId: number, accept: boolean) {
        try {
          await respondOfferRpc(messageId, accept)
          await refreshThreads()
        } catch (e) {
          fail(e)
        }
      },
      setPickup: (p: Partial<Pickup>) => setS((x) => ({ ...x, pickup: { ...x.pickup, ...p } })),
      async confirmPickup() {
        const { curThread: tid, pickup: p } = ref.current
        if (!tid) return
        try {
          await proposePickupRpc(tid, p.spot, p.day, p.time)
          setS((x) => ({ ...x, screen: 'chat', hist: x.hist.slice(0, -1) }))
          await refreshThreads()
        } catch (e) {
          fail(e, 'Could not send pickup proposal')
        }
      },
      async acceptPickup() {
        const tid = ref.current.curThread
        if (!tid) return
        try {
          await acceptPickupRpc(tid)
          await refreshThreads()
        } catch (e) {
          fail(e)
        }
      },
      onMessageRow(row: MsgRow) {
        const m = mapMsg(row)
        if (!ref.current.threads.some((t) => t.id === m.threadId)) return void refreshThreads()
        upsertMsg(m)
        if (m.sender !== ref.current.userId && isViewing(m.threadId)) void markRead(m.threadId)
      },
      onThreadRow(row: ThreadRow) {
        const t = mapThread(row)
        if (!ref.current.threads.some((i) => i.id === t.id)) return void refreshThreads()
        setS((x) => ({ ...x, threads: x.threads.map((i) => (i.id === t.id ? t : i)) }))
      },

      async confirmHandover(code: string): Promise<boolean> {
        const { curThread: tid, userId } = ref.current
        if (!tid || !userId) return false
        try {
          await confirmHandoverRpc(tid, code)
          await Promise.all([refreshThreads(), loadListings(userId)])
          toast('Handover confirmed')
          return true
        } catch (e) {
          fail(e, 'Could not confirm handover')
          return false
        }
      },
      setRate: (rate: number) => patch({ rate }),
      toggleRateTag: (t: string) => setS((x) => ({ ...x, rateTags: x.rateTags.includes(t) ? x.rateTags.filter((i) => i !== t) : [...x.rateTags, t] })),
      async submitRate(comment: string) {
        const { curThread: tid, rate, rateTags } = ref.current
        if (!tid || !rate) return
        try {
          await submitRatingRpc(tid, rate, rateTags, comment.trim())
          setS((x) => ({ ...x, rate: 0, rateTags: [], hist: [], screen: 'home', sheet: null }))
          toast('Thanks! Rating submitted')
          await refreshThreads()
          const uid = ref.current.userId
          if (uid) await loadListings(uid)
        } catch (e) {
          fail(e, 'Could not submit rating')
        }
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
          await loadListings(userId)
          setS((x) => ({ ...x, posting: false, post: EMPTY_POST, hist: [], screen: 'home', type: p.type, cat: 'All' }))
          toast('Listing posted')
          return true
        } catch (e) {
          setS((x) => ({ ...x, posting: false }))
          fail(e, 'Could not post listing')
          return false
        }
      },
      async removeListing(id: number) {
        try {
          await removeListing(id)
          setS((x) => ({ ...x, listings: x.listings.filter((l) => l.id !== id), hist: [], screen: 'home' }))
          toast('Listing removed')
        } catch (e) {
          fail(e, 'Could not remove listing')
        }
      },
      async blockUser(target: string) {
        const uid = ref.current.userId
        if (!uid) return
        try {
          await blockUser(uid, target)
          setS((x) => ({
            ...x,
            blocked: x.blocked.includes(target) ? x.blocked : [...x.blocked, target],
            sheet: null,
            ...(x.screen === 'chat' || x.screen === 'detail' ? { screen: 'home' as Screen, hist: [] } : {}),
          }))
          toast('User blocked')
        } catch (e) {
          fail(e, 'Could not block user')
        }
      },
      async unblockUser(target: string) {
        const uid = ref.current.userId
        if (!uid) return
        try {
          await unblockUser(uid, target)
          setS((x) => ({ ...x, blocked: x.blocked.filter((i) => i !== target) }))
          await loadListings(uid)
          toast('User unblocked')
        } catch (e) {
          fail(e, 'Could not unblock user')
        }
      },
      setReportDraft: (p: { reason?: ReportReason; details?: string }) =>
        setS((x) => ({ ...x, reportReason: p.reason ?? x.reportReason, reportDetails: p.details ?? x.reportDetails })),
      async submitReport() {
        const { reportReason, reportDetails } = ref.current
        const target = reportTarget(ref.current)
        if (!target || !reportReason) return
        try {
          await submitReportRpc(target.listingId, target.userId, reportReason, reportDetails.trim())
          setS((x) => ({ ...x, sheet: null, reportReason: null, reportDetails: '' }))
          toast('Reported. Our moderators will review it')
        } catch (e) {
          fail(e, 'Could not send report')
        }
      },
      loadReports: A_loadReports,
      async resolveReport(id: number, action: 'dismiss' | 'resolve' | 'remove_listing', note: string) {
        try {
          await resolveReportRpc(id, action, note)
          const uid = ref.current.userId
          await Promise.all([A_loadReports(), uid ? loadListings(uid) : Promise.resolve()])
          toast(action === 'remove_listing' ? 'Listing removed' : action === 'dismiss' ? 'Report dismissed' : 'Report resolved')
        } catch (e) {
          fail(e, 'Could not update report')
        }
      },
      openInfo(info: InfoKey) {
        setS((x) => ({ ...x, info }))
        go('info')
      },
      async saveProfile(name: string, hall: string | null): Promise<boolean> {
        const uid = ref.current.userId
        const n = name.trim()
        if (!uid) return false
        if (!n || n.length > 30) {
          toast('Name must be 1 to 30 characters')
          return false
        }
        try {
          await updateProfile(uid, n, hall)
          setS((x) => ({ ...x, sellers: { ...x.sellers, [uid]: { ...(x.sellers[uid] ?? UNKNOWN_SELLER), name: n, hall: hall ?? '' } } }))
          toast('Profile saved')
          return true
        } catch (e) {
          fail(e, 'Could not save profile')
          return false
        }
      },
      async deleteAccount() {
        try {
          await deleteAccountRpc()
        } catch (e) {
          return fail(e, 'Could not delete account')
        }
        await supabase.auth.signOut({ scope: 'local' })
        setS(() => ({ ...initial(), loading: false, toast: 'Account deleted' }))
        clearTimeout(toastTimer.current)
        toastTimer.current = window.setTimeout(() => setS((x) => ({ ...x, toast: null })), 2500)
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
        hasPw: !!u?.user_metadata?.has_pw,
        email: u?.email ?? x.email,
        screen: u && x.screen === 'login' ? 'home' : x.screen,
      }))
      // defer: supabase calls must not run inside the auth callback
      if (u) window.setTimeout(() => void A.loadData(u.id), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [A])

  // Realtime chat. RLS limits what each user receives. A slow poll is the safety net if the socket drops.
  useEffect(() => {
    if (!s.userId) return
    const channel = supabase
      .channel('campusswap-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (p) => {
        if (p.eventType !== 'DELETE') A.onMessageRow(p.new as MsgRow)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, (p) => {
        if (p.eventType !== 'DELETE') A.onThreadRow(p.new as ThreadRow)
      })
      .subscribe()
    const poll = window.setInterval(() => void A.refreshThreads(), 10000)
    return () => {
      window.clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [s.userId, A])

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

export const profileOf = (s: State, id: string | null | undefined): Seller => (id && s.sellers[id]) || UNKNOWN_SELLER
export const sellerOf = (s: State, l: Listing): Seller => profileOf(s, l.sellerId)
export const partnerId = (s: State, t: Thread) => (t.buyerId === s.userId ? t.sellerId : t.buyerId)
export const myReadAt = (s: State, t: Thread) => (t.buyerId === s.userId ? t.buyerReadAt : t.sellerReadAt)
export const unreadOf = (s: State, t: Thread) => (s.msgs[t.id] ?? []).filter((m) => m.sender !== s.userId && m.createdAt > myReadAt(s, t)).length
export const totalUnread = (s: State) => s.threads.reduce((n, t) => n + unreadOf(s, t), 0)

export function useFiltered() {
  const { s } = useApp()
  let r = s.listings.filter((x) => x.status === 'active' && x.type === s.type)
  if (s.cat !== 'All') r = r.filter((x) => x.cat === s.cat)
  if (s.q) {
    const q = s.q.toLowerCase()
    r = r.filter((x) => (x.t + x.cat + (s.sellers[x.sellerId]?.name ?? '')).toLowerCase().includes(q))
  }
  r = r.filter((x) => !s.blocked.includes(x.sellerId))
  r = r.filter((x) => x.p <= s.F.max)
  if (s.F.cond.length) r = r.filter((x) => s.F.cond.includes(x.cond))
  if (s.F.sort === 'low') r = [...r].sort((a, b) => a.p - b.p)
  if (s.F.sort === 'high') r = [...r].sort((a, b) => b.p - a.p)
  return r
}

export function reportTarget(s: State): { userId: string; listingId: number | null; name: string } | null {
  if (s.screen === 'chat') {
    const t = s.threads.find((i) => i.id === s.curThread)
    if (!t) return null
    const uid = partnerId(s, t)
    return { userId: uid, listingId: t.listingId, name: profileOf(s, uid).name }
  }
  const x = s.listings.find((l) => l.id === s.cur)
  if (!x || x.sellerId === s.userId) return null
  return { userId: x.sellerId, listingId: x.id, name: profileOf(s, x.sellerId).name }
}

export function useSaved() {
  const { s } = useApp()
  return s.listings.filter((x) => s.fav.includes(x.id) && x.status === 'active' && !s.blocked.includes(x.sellerId))
}

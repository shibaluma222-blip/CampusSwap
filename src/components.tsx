import { useState } from 'react'
import { money } from './data'
import { Icon, ImgPlaceholder, type IconName } from './icons'
import { profileOf, reportTarget, totalUnread, useApp, useFiltered } from './store'
import type { Listing, ReportReason, Screen } from './types'

export function Tabs({ active }: { active: Screen }) {
  const { s, A } = useApp()
  const unread = totalUnread(s)
  const tabs: [Screen, string, IconName][] = [
    ['home', 'Home', 'home'],
    ['post', 'Post', 'plus'],
    ['messages', 'Messages', 'chat'],
    ['profile', 'Profile', 'user'],
  ]
  return (
    <div className="tabs">
      {tabs.map(([k, l, i]) => (
        <button key={k} className={active === k ? 'on' : ''} onClick={() => A.tab(k)}>
          <Icon n={i} s={24} w={active === k ? 2.2 : 1.8} />
          {l}
          {k === 'messages' && unread > 0 && <span className="dot">{unread}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toast() {
  const { s } = useApp()
  if (!s.toast) return null
  return (
    <div className="toast">
      <Icon n="check" s={16} w={2.4} /> {s.toast}
    </div>
  )
}

export function ListingGrid() {
  return <CardGrid items={useFiltered()} empty="No results. Try removing a filter." />
}

export function CardGrid({ items: r, empty }: { items: Listing[]; empty: string }) {
  const { s, A } = useApp()
  if (!r.length) return <div className="empty">{empty}</div>
  return (
    <>
      {r.map((x) => {
        const fav = s.fav.includes(x.id)
        return (
          <button key={x.id} className="card" onClick={() => A.openListing(x.id)}>
            <div className="ph" style={{ aspectRatio: '1/.9' }}>
              {x.photos[0] ? <img src={x.photos[0]} alt="" loading="lazy" /> : <ImgPlaceholder />}
              <span
                className="fav"
                role="button"
                aria-label="Save"
                style={fav ? { background: '#111', color: '#fff' } : undefined}
                onClick={(e) => {
                  e.stopPropagation()
                  A.toggleFav(x.id)
                }}
              >
                <Icon n="heart" s={16} f={fav ? 'currentColor' : 'none'} />
              </span>
            </div>
            <div className="b">
              <div className="t">{x.t}</div>
              <div className="p">{money(x.p, x.unit)}</div>
              <span className="tag">{x.cond}</span>
            </div>
          </button>
        )
      })}
    </>
  )
}

function FilterSheet() {
  const { s, patch, A } = useApp()
  const count = useFiltered().length
  const { F } = s
  return (
    <>
      <h3>Filters</h3>
      <label className="l">
        Max price: <b style={{ color: 'var(--ink)' }}>{F.max >= 5000 ? 'Any' : money(F.max)}</b>
      </label>
      <input className="range" type="range" min={50} max={5000} step={50} value={F.max} onChange={(e) => patch({ F: { ...F, max: +e.target.value } })} />
      <label className="l">Condition</label>
      <div className="chips wrap">
        {['Like New', 'Good', 'Fair'].map((c) => (
          <button
            key={c}
            className={'chip ' + (F.cond.includes(c) ? 'on' : '')}
            onClick={() => patch({ F: { ...F, cond: F.cond.includes(c) ? F.cond.filter((x) => x !== c) : [...F.cond, c] } })}
          >
            {c}
          </button>
        ))}
      </div>
      <label className="l">Sort by</label>
      <div className="chips wrap">
        {([['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low']] as const).map(([k, l]) => (
          <button key={k} className={'chip ' + (F.sort === k ? 'on' : '')} onClick={() => patch({ F: { ...F, sort: k } })}>
            {l}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 24 }}>
        <button className="btn sec" onClick={A.resetFilters}>Reset</button>
        <button className="btn" onClick={() => A.setSheet(null)}>Show {count} results</button>
      </div>
    </>
  )
}

function OfferSheet() {
  const { s, A } = useApp()
  const x = s.listings.find((l) => l.id === s.cur)!
  const [v, setV] = useState('')
  return (
    <>
      <h3>Make an offer</h3>
      <div className="sub">Listed at {money(x.p, x.unit)}</div>
      <div className="field" style={{ margin: '16px 0' }}>
        <span style={{ color: 'var(--g4)', fontWeight: 600 }}>HK$</span>
        <input
          inputMode="numeric"
          placeholder={String(Math.round(x.p * 0.9))}
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && A.sendOffer(v)}
        />
      </div>
      <div className="chips wrap" style={{ marginBottom: 18 }}>
        {[0.9, 0.8, 0.7].map((f) => (
          <button key={f} className="chip" onClick={() => setV(String(Math.round(x.p * f)))}>
            HK${Math.round(x.p * f)}
          </button>
        ))}
      </div>
      <button className="btn" onClick={() => A.sendOffer(v)}>Send Offer</button>
    </>
  )
}

function ReportSheet() {
  const { s, A } = useApp()
  const target = reportTarget(s)
  if (!target) return null
  return (
    <>
      <div className="opt" style={{ pointerEvents: 'none', fontWeight: 700, border: 0, paddingBottom: 0 }}>
        <span>Safety</span>
      </div>
      <button className="opt" onClick={() => A.setSheet('reportReason')}>
        <Icon n="flag" s={22} />
        <span>{target.listingId ? 'Report this listing or user' : 'Report this user'}</span>
      </button>
      <button className="opt" onClick={() => A.setSheet('block')}>
        <Icon n="block" s={22} />
        <span>Block {target.name}</span>
      </button>
      <button className="opt" onClick={() => A.setSheet(null)}>
        <Icon n="x" s={22} />
        <span>Cancel</span>
      </button>
    </>
  )
}

const REASONS: [ReportReason, string][] = [
  ['spam', 'Spam or fake listing'],
  ['scam', 'Scam or suspicious'],
  ['prohibited', 'Prohibited item or service'],
  ['harassment', 'Harassment or abuse'],
  ['other', 'Something else'],
]

function ReasonSheet() {
  const { s, A } = useApp()
  const target = reportTarget(s)
  if (!target) return null
  return (
    <>
      <h3>Report {target.name}</h3>
      <div className="sub" style={{ marginBottom: 10 }}>What is the problem? Moderators see your report and who sent it.</div>
      <div className="chips wrap">
        {REASONS.map(([k, l]) => (
          <button key={k} className={'chip ' + (s.reportReason === k ? 'on' : '')} onClick={() => A.setReportDraft({ reason: k })}>{l}</button>
        ))}
      </div>
      <textarea className="ta" style={{ marginTop: 14, height: 80 }} placeholder="Add details (optional)" maxLength={300} value={s.reportDetails} onChange={(e) => A.setReportDraft({ details: e.target.value })} />
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn sec" onClick={() => A.setSheet(null)}>Cancel</button>
        <button className="btn" disabled={!s.reportReason} onClick={() => void A.submitReport()}>Send report</button>
      </div>
    </>
  )
}

function BlockSheet() {
  const { s, A } = useApp()
  const target = reportTarget(s)
  if (!target) return null
  return (
    <>
      <h3>Block {target.name}?</h3>
      <div className="sub" style={{ margin: '6px 0 18px' }}>You will not see each other's listings and neither of you can send messages. You can unblock later from your Profile.</div>
      <div className="row">
        <button className="btn sec" onClick={() => A.setSheet(null)}>Cancel</button>
        <button className="btn" onClick={() => void A.blockUser(target.userId)}>Block</button>
      </div>
    </>
  )
}

function BlockedSheet() {
  const { s, A } = useApp()
  return (
    <>
      <h3>Blocked users</h3>
      {s.blocked.length ? (
        s.blocked.map((id) => (
          <div key={id} className="opt" style={{ justifyContent: 'space-between' }}>
            <span>{profileOf(s, id).name}</span>
            <button className="btn sm sec" style={{ width: 'auto', padding: '0 14px' }} onClick={() => void A.unblockUser(id)}>Unblock</button>
          </div>
        ))
      ) : (
        <div className="sub" style={{ margin: '8px 0 12px' }}>You have not blocked anyone.</div>
      )}
      <button className="btn sec" style={{ marginTop: 8 }} onClick={() => A.setSheet(null)}>Close</button>
    </>
  )
}

function DeleteAccountSheet() {
  const { A } = useApp()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <>
      <h3>Delete your account?</h3>
      <div className="sub" style={{ margin: '6px 0 12px' }}>
        This permanently removes your profile, listings, chats, favourites and ratings. It cannot be undone.
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <input placeholder="Type DELETE to confirm" autoCapitalize="characters" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn sec" onClick={() => A.setSheet(null)}>Cancel</button>
        <button
          className="btn"
          disabled={text.trim().toUpperCase() !== 'DELETE' || busy}
          onClick={async () => {
            setBusy(true)
            await A.deleteAccount()
            setBusy(false)
          }}
        >
          Delete
        </button>
      </div>
    </>
  )
}

function RemoveSheet() {
  const { s, A } = useApp()
  const x = s.listings.find((l) => l.id === s.cur)
  if (!x) return null
  return (
    <>
      <h3>Remove this listing?</h3>
      <div className="sub" style={{ margin: '6px 0 18px' }}>"{x.t}" will disappear from Home and buyers can no longer message you about it.</div>
      <div className="row">
        <button className="btn sec" onClick={() => A.setSheet(null)}>Keep it</button>
        <button className="btn" onClick={() => void A.removeListing(x.id)}>Remove</button>
      </div>
    </>
  )
}

export function SheetHost() {
  const { s, A } = useApp()
  if (!s.sheet) return null
  return (
    <>
      <div className="scrim" onClick={() => A.setSheet(null)} />
      <div className="sheet">
        <div className="grab" />
        {s.sheet === 'filter' && <FilterSheet />}
        {s.sheet === 'offer' && <OfferSheet />}
        {s.sheet === 'report' && <ReportSheet />}
        {s.sheet === 'reportReason' && <ReasonSheet />}
        {s.sheet === 'block' && <BlockSheet />}
        {s.sheet === 'blocked' && <BlockedSheet />}
        {s.sheet === 'deleteAccount' && <DeleteAccountSheet />}
        {s.sheet === 'remove' && <RemoveSheet />}
      </div>
    </>
  )
}

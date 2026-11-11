import { useState } from 'react'
import { money } from './data'
import { Icon, ImgPlaceholder, type IconName } from './icons'
import { useApp, useFiltered } from './store'
import type { Screen } from './types'

export function Tabs({ active }: { active: Screen }) {
  const { s, A } = useApp()
  const unread = Object.values(s.chats).reduce((n, c) => n + c.unread, 0)
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
  const { s, A } = useApp()
  const r = useFiltered()
  if (!r.length) return <div className="empty">No results. Try removing a filter.</div>
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
  const { A } = useApp()
  const done = (msg: string) => {
    A.setSheet(null)
    A.toast(msg)
  }
  return (
    <>
      <div className="opt" style={{ pointerEvents: 'none', fontWeight: 700, border: 0, paddingBottom: 0 }}>
        <span>Safety</span>
      </div>
      <button className="opt" onClick={() => done('Reported. Our moderators will review it')}>
        <Icon n="flag" s={22} />
        <span>Report this listing</span>
      </button>
      <button className="opt" onClick={() => done('User blocked')}>
        <Icon n="block" s={22} />
        <span>Block this user</span>
      </button>
      <button className="opt" onClick={() => A.setSheet(null)}>
        <Icon n="x" s={22} />
        <span>Cancel</span>
      </button>
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
      </div>
    </>
  )
}

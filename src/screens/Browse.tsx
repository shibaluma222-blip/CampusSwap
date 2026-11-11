import { ListingGrid, Tabs } from '../components'
import { useState } from 'react'
import { ago, CATS, initials, money } from '../data'
import { Icon, ImgPlaceholder } from '../icons'
import { sellerOf, useApp } from '../store'

export function Home() {
  const { s, patch, A } = useApp()
  const nf = (s.F.max < 5000 ? 1 : 0) + s.F.cond.length + (s.F.sort !== 'new' ? 1 : 0)
  return (
    <div className="screen">
      <div className="top">
        <h1>CampusSwap</h1>
        <button className="ib" aria-label="Search" onClick={() => document.getElementById('q')?.focus()}>
          <Icon n="search" s={22} />
        </button>
      </div>
      <div className="scroll" style={{ paddingTop: 2 }}>
        <div className="row" style={{ gap: 8 }}>
          <div className="search" style={{ flex: 1 }}>
            <Icon n="search" s={18} />
            <input id="q" placeholder="Search for items..." value={s.q} onChange={(e) => patch({ q: e.target.value })} />
          </div>
          <button
            className="ib"
            aria-label="Filters"
            style={{
              width: 46, height: 46, borderRadius: 'var(--r)', position: 'relative',
              background: nf ? 'var(--ink)' : 'var(--g1)', color: nf ? '#fff' : 'var(--ink)', border: '1px solid var(--g2)',
            }}
            onClick={() => A.setSheet('filter')}
          >
            <Icon n="tune" s={20} />
            {nf > 0 && (
              <span className="dot" style={{ top: -5, right: -5, background: '#fff', color: '#111', border: '1.5px solid #111' }}>{nf}</span>
            )}
          </button>
        </div>
        <div className="seg" style={{ margin: '12px 0' }}>
          <button className={s.type === 'goods' ? 'on' : ''} onClick={() => A.setType('goods')}>Goods</button>
          <button className={s.type === 'services' ? 'on' : ''} onClick={() => A.setType('services')}>Services</button>
        </div>
        <div className="chips">
          {CATS[s.type].map((c) => (
            <button key={c} className={'chip ' + (s.cat === c ? 'on' : '')} onClick={() => patch({ cat: c })}>{c}</button>
          ))}
        </div>
        <div className="grid">
          {s.loading && !s.listings.length ? <div className="empty">Loading listings...</div> : <ListingGrid />}
        </div>
      </div>
      <Tabs active="home" />
    </div>
  )
}

export function Detail() {
  const { s, A } = useApp()
  const [pi, setPi] = useState(0)
  const x = s.listings.find((l) => l.id === s.cur)
  if (!x) return null
  const seller = sellerOf(s, x)
  const fav = s.fav.includes(x.id)
  const mine = x.sellerId === s.userId
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <div style={{ flex: 1 }} />
        <button className="ib" aria-label="Save" style={fav ? { color: '#111' } : undefined} onClick={() => A.toggleFav(x.id)}>
          <Icon n="heart" s={22} f={fav ? 'currentColor' : 'none'} />
        </button>
        {!mine && <button className="ib" aria-label="More" onClick={() => A.setSheet('report')}><Icon n="more" /></button>}
      </div>
      <div className="scroll">
        <div className="ph" style={{ height: 250, borderRadius: 'var(--r)' }} onClick={() => x.photos.length > 1 && setPi((pi + 1) % x.photos.length)}>
          {x.photos.length ? <img src={x.photos[pi % x.photos.length]} alt={x.t} /> : <ImgPlaceholder />}
        </div>
        <div className="dots">{(x.photos.length ? x.photos : ['']).map((_, i) => <i key={i} className={i === pi % Math.max(1, x.photos.length) ? 'on' : ''} />)}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <span className="tag k">{x.cond}</span>
          <span className="tag">{x.cat}</span>
          <span className="tag">{ago(x.createdAt)}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 750, letterSpacing: '-.4px', lineHeight: 1.2 }}>{x.t}</div>
        <div style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 16px' }}>{money(x.p, x.unit)}</div>
        <div className="seller">
          <div className="av">{initials(seller.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 650, fontSize: 16 }}>{seller.name}</div>
            <div className="meta">
              <Icon n="star" s={14} f="currentColor" w={1} /> {seller.n > 0 ? seller.r.toFixed(1) : 'New'} <span>· {seller.n} trades</span>
            </div>
            <div style={{ marginTop: 6 }}><span className="tag"><Icon n="shield" s={13} /> CityU Verified</span></div>
          </div>
        </div>
        <div className="sec-t">Description</div>
        <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--g5)' }}>{x.d}</div>
        <div className="sec-t">Meetup spots</div>
        <div className="chips wrap">
          {x.spots.map((p) => (
            <span key={p} className="tag" style={{ fontSize: 13, padding: '7px 12px' }}><Icon n="pin" s={14} /> {p}</span>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 14 }}>
          <Icon n="shield" s={14} /> Meet in shared hall areas only. Confirm the handover with the QR code in the app.
        </div>
      </div>
      <div className="footer">
        {x.status !== 'active' ? (
          <button className="btn sec" disabled>{x.status === 'sold' ? 'Sold' : 'No longer available'}</button>
        ) : mine ? (
          <button className="btn sec" onClick={() => A.setSheet('remove')}>Remove my listing</button>
        ) : (
          <button className="btn" onClick={A.startChat}><Icon n="chat" s={20} /> Chat / Make Offer</button>
        )}
      </div>
    </div>
  )
}

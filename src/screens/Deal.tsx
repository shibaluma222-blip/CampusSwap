import { useEffect, useRef, useState } from 'react'
import { initials, money } from '../data'
import { Icon, ImgPlaceholder } from '../icons'
import { Qr } from '../Qr'
import { sellerOf, useApp } from '../store'
import type { Chat as ChatT, Listing } from '../types'

function DealCard({ c, x }: { c: ChatT; x: Listing }) {
  const { A } = useApp()
  if (c.pickup) {
    const p = c.pickup
    return (
      <div className="deal">
        <small>Pickup set</small>
        <b>{p.day} {p.time}, {p.spot}</b>
        <button className="btn sm" onClick={() => A.go('confirm')}><Icon n="qr" s={16} /> View Handover QR</button>
      </div>
    )
  }
  return (
    <div className="deal">
      <small>Offer accepted</small>
      <b>{money(c.agreed ?? x.p, x.unit)}</b>
      <div className="sub" style={{ margin: '2px 0 12px' }}>Next: pick a lobby spot and time.</div>
      <button className="btn sm" onClick={() => A.go('schedule')}><Icon n="cal" s={16} /> Schedule Pickup</button>
    </div>
  )
}

export function Chat() {
  const { s, A } = useApp()
  const x = s.listings.find((l) => l.id === s.cur)
  const [msg, setMsg] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const c = s.chats[s.cur] ?? { msgs: [], unread: 0 }
  useEffect(() => { end.current?.scrollIntoView() }, [c.msgs.length, s.typing])
  if (!x) return null
  const seller = sellerOf(s, x)
  const send = () => {
    const t = msg.trim()
    if (!t) return
    A.sendMsg(t)
    setMsg('')
  }
  const sm = { width: 'auto', padding: '0 14px', flex: 'none' } as const
  return (
    <div className="screen">
      <div className="top" style={{ borderBottom: '1px solid var(--g2)', paddingBottom: 8 }}>
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <div className="av s">{initials(seller.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650 }}>{seller.name}</div>
          <div style={{ fontSize: 12, color: 'var(--g4)' }}>Online · CityU Verified</div>
        </div>
        <button className="ib" aria-label="More" onClick={() => A.setSheet('report')}><Icon n="more" /></button>
      </div>
      <div className="mini">
        <button onClick={() => A.openListing(x.id)} style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div className="ph">{x.photos[0] ? <img src={x.photos[0]} alt="" /> : <ImgPlaceholder />}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.t}</div>
            <div style={{ fontSize: 13, color: 'var(--g5)' }}>{money(c.agreed ?? x.p, x.unit)}</div>
          </div>
        </button>
        {c.pickup ? (
          <button className="btn sm" style={sm} onClick={() => A.go('confirm')}><Icon n="qr" s={16} /> Handover QR</button>
        ) : (
          <button className="btn sm" style={sm} onClick={() => A.go('schedule')}><Icon n="cal" s={16} /> Schedule Pickup</button>
        )}
      </div>
      <div className="msgs">
        {!c.msgs.length && <div className="sys">Say hi to {seller.name.split(' ')[0]} or make an offer</div>}
        {c.msgs.map((m, i) => {
          if (m.card) return <DealCard key={i} c={c} x={x} />
          if (m.sys) return <div key={i} className="sys"><Icon n={m.icon ?? 'cal'} s={14} /> {m.t}</div>
          if (m.offer) {
            return (
              <div key={i} style={{ display: 'contents' }}>
                <div className="offer"><small>Offer</small><b>{money(m.offer)}</b></div>
                <div className="ts me">{m.ts}</div>
              </div>
            )
          }
          return (
            <div key={i} style={{ display: 'contents' }}>
              <div className={'m ' + m.w}>{m.t}</div>
              <div className={'ts ' + (m.w === 'me' ? 'me' : '')}>{m.ts}</div>
            </div>
          )
        })}
        {s.typing && <div className="typing"><i /><i /><i /></div>}
        <div ref={end} />
      </div>
      <div className="composer">
        <div className="qa">
          <button className="chip" onClick={() => A.setSheet('offer')}><Icon n="tag" s={15} /> Make Offer</button>
          <button className="chip" onClick={() => A.go('schedule')}><Icon n="cal" s={15} /> Propose Pickup Time</button>
          {c.pickup && <button className="chip on" onClick={() => A.go('confirm')}><Icon n="qr" s={15} /> Handover QR</button>}
        </div>
        <div className="row">
          <div className="field" style={{ height: 46, flex: 1, borderRadius: 23 }}>
            <input placeholder="Message..." autoComplete="off" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
          </div>
          <button className="ib" aria-label="Send" style={{ background: 'var(--ink)', color: '#fff', width: 46, height: 46 }} onClick={send}>
            <Icon n="send" s={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Schedule() {
  const { s, A } = useApp()
  const x = s.listings.find((l) => l.id === s.cur)
  if (!x) return null
  const p = s.pickup
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Schedule Pickup</h2>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll">
        <div className="sec-t" style={{ marginTop: 6 }}>Where</div>
        {x.spots.map((sp) => (
          <button key={sp} className={'spot ' + (p.spot === sp ? 'on' : '')} onClick={() => A.setPickup({ spot: sp })}>
            <Icon n="pin" s={20} />
            <div>
              <div style={{ fontWeight: 600 }}>{sp}</div>
              <div style={{ fontSize: 12.5, color: 'var(--g4)' }}>Shared area · CCTV covered</div>
            </div>
            <span className="rd" />
          </button>
        ))}
        <div className="sec-t">Day</div>
        <div className="chips wrap">
          {['Today', 'Tomorrow', 'Fri', 'Sat', 'Sun'].map((d) => (
            <button key={d} className={'chip ' + (p.day === d ? 'on' : '')} onClick={() => A.setPickup({ day: d })}>{d}</button>
          ))}
        </div>
        <div className="sec-t">Time</div>
        <div className="chips wrap">
          {['12:00', '15:00', '17:30', '19:00', '21:00'].map((t) => (
            <button key={t} className={'chip ' + (p.time === t ? 'on' : '')} onClick={() => A.setPickup({ time: t })}>{t}</button>
          ))}
        </div>
        <div className="infocard" style={{ marginTop: 26 }}>
          <Icon n="cal" s={24} />
          <div><small>Proposed pickup</small><b>{p.day} {p.time}, {p.spot}</b></div>
        </div>
      </div>
      <div className="footer"><button className="btn" onClick={A.confirmPickup}>Send Pickup Proposal</button></div>
    </div>
  )
}

export function Confirm() {
  const { s, A } = useApp()
  const x = s.listings.find((l) => l.id === s.cur)
  if (!x) return null
  const p = s.pickup
  const seller = sellerOf(s, x)
  const d = s.handover
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Handover</h2>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll center">
        <div className="bigcheck" style={{ marginTop: 6 }}>
          <Icon n={d ? 'check' : 'qr'} s={d ? 52 : 44} w={d ? 2.4 : 1.6} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>{d ? 'Handover confirmed' : 'All Set!'}</div>
        <div className="sub" style={{ marginTop: 4 }}>{d ? `You got the ${x.t.toLowerCase()}.` : 'Your pickup is confirmed.'}</div>
        <div className={'qrbox ' + (d ? 'done' : '')}>
          <Qr seed={'CS-' + x.id + p.spot + p.day + p.time} />
          {d && <div className="ov"><Icon n="check" s={70} w={2.2} /></div>}
        </div>
        <div className="sub" style={{ marginBottom: 14 }}>{d ? 'Seller scanned your code' : `Show this code to ${seller.name.split(' ')[0]} at pickup`}</div>
        <div className="infocard">
          <Icon n="cal" s={24} />
          <div><small>Pickup</small><b>{p.day} {p.time}, {p.spot}</b></div>
        </div>
        <div className="infocard" style={{ marginTop: 10 }}>
          <Icon n="tag" s={24} />
          <div><small>Agreed price</small><b>{money(s.chats[x.id]?.agreed ?? x.p, x.unit)}</b></div>
        </div>
        {!d && <button className="btn sec sm" style={{ marginTop: 16 }} onClick={A.simulateScan}>Demo: simulate seller scan</button>}
      </div>
      <div className="footer"><button className="btn" disabled={!d} onClick={() => A.go('rate')}>Rate Seller</button></div>
    </div>
  )
}

export function Rate() {
  const { s, A } = useApp()
  const x = s.listings.find((l) => l.id === s.cur)
  if (!x) return null
  const seller = sellerOf(s, x)
  const tags = ['On time', 'As described', 'Friendly', 'Easy handover', 'Fair price']
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Rate Seller</h2>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll center">
        <div className="av l" style={{ margin: '20px auto 12px' }}>{initials(seller.name)}</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{seller.name}</div>
        <div className="sub">{x.t}</div>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} aria-label={`${i} star`} className={s.rate >= i ? 'on' : ''} onClick={() => A.setRate(i)}>
              <Icon n="star" s={42} f={s.rate >= i ? 'currentColor' : 'none'} w={1.6} />
            </button>
          ))}
        </div>
        <div className="chips wrap" style={{ justifyContent: 'center' }}>
          {tags.map((t) => (
            <button key={t} className={'chip ' + (s.rateTags.includes(t) ? 'on' : '')} onClick={() => A.toggleRateTag(t)}>{t}</button>
          ))}
        </div>
        <textarea className="ta" placeholder="Add a comment (optional)" style={{ marginTop: 20 }} />
      </div>
      <div className="footer"><button className="btn" disabled={!s.rate} onClick={A.submitRate}>Submit Rating</button></div>
    </div>
  )
}

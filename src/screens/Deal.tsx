import { useEffect, useRef, useState } from 'react'
import { getHandoverToken } from '../api'
import { clock, initials, money } from '../data'
import { Icon, ImgPlaceholder } from '../icons'
import { Qr } from '../Qr'
import { Scanner } from '../Scanner'
import { partnerId, profileOf, useApp } from '../store'
import type { Msg } from '../types'

/** The open conversation with its listing, partner and my role. */
function useDeal() {
  const { s } = useApp()
  const t = s.threads.find((i) => i.id === s.curThread)
  const x = t ? s.listings.find((l) => l.id === t.listingId) : undefined
  const partner = t ? profileOf(s, partnerId(s, t)) : undefined
  const iAmBuyer = !!t && t.buyerId === s.userId
  const msgs = t ? s.msgs[t.id] ?? [] : []
  return { t, x, partner, iAmBuyer, msgs }
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'Waiting for reply',
  accepted: 'Accepted',
  declined: 'Declined',
  superseded: 'Replaced by a newer offer',
}

function OfferBubble({ m, mine, name }: { m: Msg; mine: boolean; name: string }) {
  const { A } = useApp()
  const pending = m.offerStatus === 'pending'
  return (
    <div style={{ display: 'contents' }}>
      <div className={'offer ' + (mine ? '' : 'them')}>
        <small>{mine ? 'Your offer' : `Offer from ${name}`}</small>
        <b>{money(m.amount ?? 0)}</b>
        {!mine && pending ? (
          <div className="acts">
            <button className="btn sec" onClick={() => void A.respondOffer(m.id, false)}>Decline</button>
            <button className="btn" onClick={() => void A.respondOffer(m.id, true)}>Accept</button>
          </div>
        ) : (
          <span className="st">{STATUS_TEXT[m.offerStatus ?? 'pending']}</span>
        )}
      </div>
      <div className={'ts ' + (mine ? 'me' : '')}>{clock(m.createdAt)}</div>
    </div>
  )
}

function StatusCard() {
  const { s, A } = useApp()
  const { t, x, partner } = useDeal()
  if (!t || !x || t.status === 'open') return null
  const first = partner?.name.split(' ')[0] ?? 'them'
  const p = t.pickup
  if (t.status === 'completed') {
    const canRate = t.buyerId === s.userId && !s.rated.includes(t.id)
    return (
      <div className="deal">
        <small>Deal complete</small>
        <b>{money(t.agreed ?? x.p, x.unit)}</b>
        {canRate && <button className="btn sm" onClick={() => A.go('rate')}><Icon n="star" s={16} /> Rate Seller</button>}
      </div>
    )
  }
  if (!p) {
    return (
      <div className="deal">
        <small>Offer accepted</small>
        <b>{money(t.agreed ?? x.p, x.unit)}</b>
        <div className="sub" style={{ margin: '2px 0 12px' }}>Next: pick a lobby spot and time.</div>
        <button className="btn sm" onClick={() => A.go('schedule')}><Icon n="cal" s={16} /> Schedule Pickup</button>
      </div>
    )
  }
  if (p.status === 'accepted') {
    return (
      <div className="deal">
        <small>Pickup set</small>
        <b>{p.day} {p.time}, {p.spot}</b>
        <button className="btn sm" onClick={() => A.go('confirm')}><Icon n="qr" s={16} /> View Handover QR</button>
      </div>
    )
  }
  const mine = p.by === s.userId
  return (
    <div className="deal">
      <small>{mine ? `Waiting for ${first} to accept` : `${first} proposed a pickup`}</small>
      <b>{p.day} {p.time}, {p.spot}</b>
      <div className="row">
        {!mine && <button className="btn sm" onClick={() => void A.acceptPickup()}><Icon n="check" s={16} /> Accept</button>}
        <button className="btn sm sec" onClick={() => A.go('schedule')}>{mine ? 'Change proposal' : 'Suggest another'}</button>
      </div>
    </div>
  )
}

export function Chat() {
  const { s, A } = useApp()
  const { t, x, partner, iAmBuyer, msgs } = useDeal()
  const [msg, setMsg] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView() }, [msgs.length, t?.status, t?.pickup?.status])

  if (!t || !x || !partner) {
    return (
      <div className="screen">
        <div className="top"><button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button><h2>Chat</h2><div style={{ width: 40 }} /></div>
        <div className="empty">{s.threads.length ? 'This conversation is no longer available.' : 'Loading...'}</div>
      </div>
    )
  }
  const send = () => {
    const text = msg.trim()
    if (!text) return
    void A.sendMsg(text)
    setMsg('')
  }
  const sm = { width: 'auto', padding: '0 14px', flex: 'none' } as const
  const accepted = t.pickup?.status === 'accepted' && t.status === 'agreed'
  return (
    <div className="screen">
      <div className="top" style={{ borderBottom: '1px solid var(--g2)', paddingBottom: 8 }}>
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <div className="av s">{initials(partner.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650 }}>{partner.name}</div>
          <div style={{ fontSize: 12, color: 'var(--g4)' }}>{iAmBuyer ? 'Seller' : 'Buyer'} · CityU Verified</div>
        </div>
        <button className="ib" aria-label="More" onClick={() => A.setSheet('report')}><Icon n="more" /></button>
      </div>
      <div className="mini">
        <button onClick={() => A.openListing(x.id)} style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div className="ph">{x.photos[0] ? <img src={x.photos[0]} alt="" /> : <ImgPlaceholder />}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.t}</div>
            <div style={{ fontSize: 13, color: 'var(--g5)' }}>{money(t.agreed ?? x.p, x.unit)}</div>
          </div>
        </button>
        {accepted && <button className="btn sm" style={sm} onClick={() => A.go('confirm')}><Icon n="qr" s={16} /> Handover QR</button>}
      </div>
      <div className="msgs">
        {!msgs.length && <div className="sys">Say hi to {partner.name.split(' ')[0]}{iAmBuyer ? ' or make an offer' : ''}</div>}
        {msgs.map((m) => {
          const mine = m.sender === s.userId
          if (m.kind === 'system') return <div key={m.id} className="sys">{m.body}</div>
          if (m.kind === 'offer') return <OfferBubble key={m.id} m={m} mine={mine} name={partner.name.split(' ')[0]} />
          return (
            <div key={m.id} style={{ display: 'contents' }}>
              <div className={'m ' + (mine ? 'me' : 'them')}>{m.body}</div>
              <div className={'ts ' + (mine ? 'me' : '')}>{clock(m.createdAt)}</div>
            </div>
          )
        })}
        <StatusCard />
        <div ref={end} />
      </div>
      <div className="composer">
        <div className="qa">
          {iAmBuyer && t.status === 'open' && (
            <button className="chip" onClick={() => A.setSheet('offer')}><Icon n="tag" s={15} /> Make Offer</button>
          )}
          {t.status === 'agreed' && !accepted && (
            <button className="chip" onClick={() => A.go('schedule')}><Icon n="cal" s={15} /> Propose Pickup Time</button>
          )}
          {accepted && <button className="chip on" onClick={() => A.go('confirm')}><Icon n="qr" s={15} /> Handover QR</button>}
        </div>
        <div className="row">
          <div className="field" style={{ height: 46, flex: 1, borderRadius: 23 }}>
            <input placeholder="Message..." autoComplete="off" maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
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
  const { x } = useDeal()
  const p = s.pickup
  const spots = x?.spots ?? []
  useEffect(() => {
    if (spots.length && !spots.includes(s.pickup.spot)) A.setPickup({ spot: spots[0] })
  }, [spots, s.pickup.spot, A])
  if (!x) return null
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
      <div className="footer"><button className="btn" onClick={() => void A.confirmPickup()}>Send Pickup Proposal</button></div>
    </div>
  )
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : 'Something went wrong')
const prettyCode = (c: string) => c.replace(/(.{4})(?=.)/g, '$1-')

export function Confirm() {
  const { s, A } = useApp()
  const { t, x, partner, iAmBuyer } = useDeal()
  const [token, setToken] = useState('')
  const [err, setErr] = useState('')
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const tid = t?.id
  const done = t?.status === 'completed'

  useEffect(() => {
    if (!tid || !iAmBuyer || done) return
    let live = true
    getHandoverToken(tid)
      .then((v) => live && setToken(v))
      .catch((e) => live && setErr(errMsg(e)))
    return () => { live = false }
  }, [tid, iAmBuyer, done])

  if (!t || !x || !partner || !t.pickup) return null
  const p = t.pickup
  const first = partner.name.split(' ')[0]

  const confirm = async (raw: string) => {
    setBusy(true)
    await A.confirmHandover(raw)
    setBusy(false)
  }
  const onScan = (text: string) => {
    setScanning(false)
    const m = /^CS1:(\d+):([A-Za-z0-9]+)$/.exec(text.trim())
    if (!m || Number(m[1]) !== t.id) return A.toast('This QR code is not for this deal')
    void confirm(m[2])
  }

  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Handover</h2>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll center">
        {done ? (
          <>
            <div className="bigcheck" style={{ marginTop: 6 }}><Icon n="check" s={52} w={2.4} /></div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Handover confirmed</div>
            <div className="sub" style={{ marginTop: 4 }}>{iAmBuyer ? `You got the ${x.t.toLowerCase()}.` : `${first} has the ${x.t.toLowerCase()}.`}</div>
          </>
        ) : iAmBuyer ? (
          <>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>All Set!</div>
            <div className="sub" style={{ marginTop: 4 }}>Show this code to {first} at pickup.</div>
            <div className="qrbox">{token ? <Qr value={`CS1:${t.id}:${token}`} /> : <div className="ov sub">{err || 'Loading code...'}</div>}</div>
            {token && <div className="codebox">{prettyCode(token)}</div>}
            <div className="sub" style={{ marginBottom: 14 }}>{first} scans this in the app to confirm. Only share it in person.</div>
          </>
        ) : (
          <>
            <div className="bigcheck" style={{ marginTop: 6 }}><Icon n="qr" s={44} w={1.6} /></div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Confirm handover</div>
            <div className="sub" style={{ margin: '4px 0 16px' }}>When you meet {first}, scan their QR code to complete the deal.</div>
            <button className="btn" disabled={busy} onClick={() => setScanning(true)}><Icon n="cam" s={20} /> Scan QR code</button>
            <div className="sub" style={{ margin: '18px 0 8px' }}>No camera? Enter the code {first} shows</div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <input placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters" autoComplete="off" maxLength={14} value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <button className="btn sec" style={{ width: 96 }} disabled={busy || code.replace(/[^A-Za-z0-9]/g, '').length < 12} onClick={() => void confirm(code)}>Confirm</button>
            </div>
          </>
        )}
        <div className="infocard" style={{ marginTop: 18 }}>
          <Icon n="cal" s={24} />
          <div><small>Pickup</small><b>{p.day} {p.time}, {p.spot}</b></div>
        </div>
        <div className="infocard" style={{ marginTop: 10 }}>
          <Icon n="tag" s={24} />
          <div><small>Agreed price</small><b>{money(t.agreed ?? x.p, x.unit)}</b></div>
        </div>
      </div>
      <div className="footer">
        {done && iAmBuyer && !s.rated.includes(t.id) ? (
          <button className="btn" onClick={() => A.go('rate')}>Rate Seller</button>
        ) : (
          <button className="btn sec" onClick={A.back}>Back to chat</button>
        )}
      </div>
      {scanning && <Scanner onResult={onScan} onClose={() => setScanning(false)} />}
    </div>
  )
}

export function Rate() {
  const { s, A } = useApp()
  const { x, partner } = useDeal()
  const [comment, setComment] = useState('')
  if (!x || !partner) return null
  const tags = ['On time', 'As described', 'Friendly', 'Easy handover', 'Fair price']
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Rate Seller</h2>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll center">
        <div className="av l" style={{ margin: '20px auto 12px' }}>{initials(partner.name)}</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{partner.name}</div>
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
        <textarea className="ta" placeholder="Add a comment (optional)" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginTop: 20 }} />
      </div>
      <div className="footer"><button className="btn" disabled={!s.rate} onClick={() => void A.submitRate(comment)}>Submit Rating</button></div>
    </div>
  )
}

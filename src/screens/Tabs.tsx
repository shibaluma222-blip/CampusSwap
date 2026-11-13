import { useEffect, useMemo, useRef, useState } from 'react'
import { CardGrid, Tabs } from '../components'
import { CATS, clock, initials, money, SPOTS } from '../data'
import { Icon, ImgPlaceholder } from '../icons'
import { partnerId, profileOf, unreadOf, useApp, useSaved } from '../store'

const MAX_PHOTOS = 3

export function Post() {
  const { s, A } = useApp()
  const p = s.post
  const [files, setFiles] = useState<File[]>([])
  const input = useRef<HTMLInputElement>(null)
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const chips = (key: 'cat' | 'cond' | 'spot' | 'unit', opts: string[], labels?: Record<string, string>) => (
    <div className="chips wrap">
      {opts.map((c) => (
        <button key={c} className={'chip ' + (p[key] === c ? 'on' : '')} onClick={() => A.setPost({ [key]: c })}>{labels?.[c] ?? c}</button>
      ))}
    </div>
  )
  const [tried, setTried] = useState(false)
  const [neg, setNeg] = useState(false)
  const editing = s.editId !== null
  const services = p.type === 'services'
  const errPhoto = !editing && files.length === 0
  const errTitle = !p.title.trim()
  const errPrice = !(+p.price > 0)
  const bad = (on: boolean) => tried && on
  const submit = () => {
    if (errPhoto || errTitle || errPrice) {
      setTried(true)
      A.toast(errPhoto ? 'Add at least one photo' : errTitle ? 'Add a title' : 'Add a price above 0', true)
      document.getElementById(errPhoto ? 'f-photo' : errTitle ? 'f-title' : 'f-price')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    if (editing) void A.saveEdit()
    else void A.publish(files).then((ok) => ok && (setFiles([]), setTried(false)))
  }
  const need = { color: 'var(--ink)', fontWeight: 600 } as const
  return (
    <div className="screen">
      {editing ? (
        <div className="top">
          <button className="ib" aria-label="Back" onClick={A.cancelEdit}><Icon n="back" /></button>
          <h2>Edit Listing</h2>
          <div style={{ width: 40 }} />
        </div>
      ) : (
        <div className="top"><h1>New Listing</h1></div>
      )}
      <div className="scroll" style={{ paddingTop: 0 }}>
        {!editing && (
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={!services ? 'on' : ''} onClick={() => A.setPost({ type: 'goods' })}>Goods</button>
          <button className={services ? 'on' : ''} onClick={() => A.setPost({ type: 'services' })}>Services</button>
        </div>
        )}
        {editing ? (
          <div className="hint" style={{ margin: '0 0 6px' }}>Photos cannot be changed yet. Remove the listing and post it again to use new photos.</div>
        ) : (
        <>
        <button
          id="f-photo"
          className="ph"
          style={{ width: '100%', height: files.length ? 70 : 140, borderRadius: 'var(--r)', border: bad(errPhoto) ? '1.5px dashed var(--ink)' : '1.5px dashed var(--g3)' }}
          onClick={() => input.current?.click()}
          disabled={files.length >= MAX_PHOTOS}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--g4)', gap: 6 }}>
            <Icon n="cam" s={files.length ? 22 : 30} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{files.length ? `${files.length}/${MAX_PHOTOS} photos` : 'Add photos (required)'}</span>
          </div>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            setFiles((f) => [...f, ...Array.from(e.target.files ?? [])].slice(0, MAX_PHOTOS))
            e.target.value = ''
          }}
        />
        {files.length > 0 && (
          <div className="thumbs">
            {previews.map((u, i) => (
              <div key={u} className="th">
                <img src={u} alt="" />
                <button aria-label="Remove photo" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
        )}
        {bad(errPhoto) && <div className="hint" style={need}>Add at least one photo of the item.</div>}
        </>
        )}
        <label className="l">Title *</label>
        <div id="f-title" className={'field ' + (bad(errTitle) ? 'err' : '')}><input placeholder={services ? 'e.g. Calculus tutoring' : 'e.g. IKEA desk lamp'} maxLength={80} value={p.title} onChange={(e) => A.setPost({ title: e.target.value })} /></div>
        {bad(errTitle) && <div className="hint" style={need}>Add a title.</div>}
        <label className="l">Price (HK$) *</label>
        <div id="f-price" className={'field ' + (bad(errPrice) || neg ? 'err' : '')}>
          <span style={{ color: 'var(--g4)' }}>HK$</span>
          <input
            inputMode="numeric"
            placeholder="0"
            maxLength={7}
            value={p.price}
            onChange={(e) => {
              setNeg(e.target.value.includes('-'))
              A.setPost({ price: e.target.value.replace(/\D/g, '').replace(/^0+/, '') })
            }}
          />
        </div>
        {neg && <div className="hint" style={need}>Price cannot be negative.</div>}
        {!neg && bad(errPrice) && <div className="hint" style={need}>Enter a price above 0.</div>}
        {services && (
          <>
            <label className="l">Charged</label>
            {chips('unit', ['/hr', '/session', ''], { '/hr': 'Per hour', '/session': 'Per session', '': 'Fixed price' })}
          </>
        )}
        <label className="l">Category</label>
        {chips('cat', CATS[p.type].slice(1))}
        {!services && (
          <>
            <label className="l">Condition</label>
            {chips('cond', ['Like New', 'Good', 'Fair'])}
          </>
        )}
        <label className="l">Meetup spot *</label>
        {chips('spot', SPOTS.slice(0, 5))}
        <label className="l">Description</label>
        <textarea className="ta" placeholder="Condition, size, reason for selling..." maxLength={2000} value={p.desc} onChange={(e) => A.setPost({ desc: e.target.value })} />
      </div>
      <div className="footer" style={{ border: 0, paddingTop: 6 }}>
        <button className="btn" disabled={s.posting} onClick={submit}>
          {s.posting ? (editing ? 'Saving...' : 'Posting...') : editing ? 'Save changes' : 'Post Listing'}
        </button>
      </div>
      {!editing && <Tabs active="post" />}
    </div>
  )
}

export function Messages() {
  const { s, A } = useApp()
  const rows = s.threads
    .map((t) => ({ t, x: s.listings.find((l) => l.id === t.listingId), list: s.msgs[t.id] ?? [] }))
    .filter((r) => r.x && !s.blocked.includes(partnerId(s, r.t)))
    .sort((a, b) => (b.list[b.list.length - 1]?.createdAt ?? b.t.createdAt).localeCompare(a.list[a.list.length - 1]?.createdAt ?? a.t.createdAt))
  return (
    <div className="screen">
      <div className="top"><h1>Messages</h1></div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        {rows.length ? (
          rows.map(({ t, x, list }) => {
            const partner = profileOf(s, partnerId(s, t))
            const last = list[list.length - 1]
            const unread = unreadOf(s, t)
            const preview = !last ? 'No messages yet' : last.kind === 'offer' ? 'Offer: ' + money(last.amount ?? 0) : last.body
            return (
              <button key={t.id} className="thread" onClick={() => A.openThread(t.id)}>
                <div className="av">{initials(partner.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="n"><b>{partner.name}</b><span>{last ? clock(last.createdAt) : ''}</span></div>
                  <div className="pv" style={unread ? { color: 'var(--ink)', fontWeight: 600 } : undefined}>{preview}</div>
                  <div style={{ fontSize: 12, color: 'var(--g4)', marginTop: 2 }}>{x!.t}</div>
                </div>
                {unread > 0 && <span className="tag k">{unread}</span>}
              </button>
            )
          })
        ) : (
          <div className="empty">{s.loading ? 'Loading...' : 'No messages yet. Open a listing to start a chat.'}</div>
        )}
      </div>
      <Tabs active="messages" />
    </div>
  )
}

export function Profile() {
  const { s, A } = useApp()
  const [hist, setHist] = useState<'active' | 'sold' | 'removed'>('active')
  const all = s.listings.filter((x) => x.sellerId === s.userId)
  const mine = all.filter((x) => x.status === 'active')
  const shown = all.filter((x) => x.status === hist)
  const saved = useSaved()
  const me = s.userId ? s.sellers[s.userId] : undefined
  const name = me?.name ?? (s.email ? s.email.split('@')[0] : 'you')
  const init = initials(name).slice(0, 2).toUpperCase() || 'ME'
  return (
    <div className="screen">
      <div className="top">
        <h1>Profile</h1>
        <button className="ib" aria-label="Settings" onClick={() => A.go('settings')}><Icon n="gear" s={22} /></button>
      </div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div className="center" style={{ padding: '6px 0 18px' }}>
          <div className="av l" style={{ margin: '0 auto 10px' }}>{init}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{name}</div>
          <div style={{ marginTop: 6 }}><span className="tag"><Icon n="shield" s={13} /> CityU Verified</span></div>
        </div>
        <div className="row">
          <div className="stat"><b>{mine.length}</b><span>Listings</span></div>
          <button className="stat" onClick={() => A.go('saved')}><b>{saved.length}</b><span>Saved</span></button>
          <div className="stat"><b>{me && me.n > 0 ? me.r.toFixed(1) : '-'}</b><span>Rating</span></div>
        </div>
        <div className="sec-t">My listings</div>
        <div className="seg" style={{ marginBottom: 12 }}>
          {(['active', 'sold', 'removed'] as const).map((k) => (
            <button key={k} className={hist === k ? 'on' : ''} onClick={() => setHist(k)}>
              {k === 'active' ? 'Active' : k === 'sold' ? 'Sold' : 'Removed'} {all.filter((x) => x.status === k).length}
            </button>
          ))}
        </div>
        {shown.length ? (
          <div className="grid" style={{ marginTop: 0 }}>
            {shown.map((x) => {
              const deal = x.status === 'sold' ? s.threads.find((t) => t.listingId === x.id && t.status === 'completed') : undefined
              return (
                <button key={x.id} className="card" onClick={() => A.openListing(x.id)}>
                  <div className="ph">{x.photos[0] ? <img src={x.photos[0]} alt="" loading="lazy" /> : <ImgPlaceholder />}</div>
                  <div className="b">
                    <div className="t">{x.t}</div>
                    <div className="p" style={{ marginBottom: 0 }}>{money(deal?.agreed ?? x.p, x.unit)}</div>
                    {x.status !== 'active' && <span className="tag">{x.status === 'sold' ? 'Sold' : 'Removed'}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="hint" style={{ margin: 0 }}>
            {hist === 'active' ? 'Nothing posted yet. Tap Post to list your first item.' : hist === 'sold' ? 'Nothing sold yet.' : 'No removed listings.'}
          </div>
        )}
        <div className="sec-t">Account</div>
        <div className="list">
          <button className="li" onClick={() => A.go('saved')}><Icon n="heart" s={20} /><span className="s">Saved items{saved.length ? ` (${saved.length})` : ''}</span></button>
          {me?.admin && (
            <button className="li" onClick={() => A.go('admin')}><Icon n="shield" s={20} /><span className="s">Moderation</span></button>
          )}
          <button className="li" onClick={() => A.go('settings')}><Icon n="gear" s={20} /><span className="s">Settings</span></button>
        </div>
      </div>
      <Tabs active="profile" />
    </div>
  )
}

export function Saved() {
  const { A } = useApp()
  const saved = useSaved()
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Saved items</h2>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div className="grid" style={{ marginTop: 4 }}>
          <CardGrid items={saved} empty="Nothing saved yet. Tap the heart on a listing to keep it here." />
        </div>
      </div>
    </div>
  )
}

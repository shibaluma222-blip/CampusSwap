import { Tabs } from '../components'
import { initials, money, SELLERS, SPOTS } from '../data'
import { Icon, ImgPlaceholder } from '../icons'
import { useApp } from '../store'

export function Post() {
  const { s, A } = useApp()
  const p = s.post
  const chips = (key: 'cat' | 'cond' | 'spot', opts: string[]) => (
    <div className="chips wrap">
      {opts.map((c) => (
        <button key={c} className={'chip ' + (p[key] === c ? 'on' : '')} onClick={() => A.setPost({ [key]: c })}>{c}</button>
      ))}
    </div>
  )
  return (
    <div className="screen">
      <div className="top"><h1>New Listing</h1></div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div className="ph" style={{ height: 140, borderRadius: 'var(--r)', border: '1.5px dashed var(--g3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--g4)', gap: 6 }}>
            <Icon n="cam" s={30} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Add photos</span>
          </div>
        </div>
        <label className="l">Title</label>
        <div className="field"><input placeholder="e.g. IKEA desk lamp" value={p.title} onChange={(e) => A.setPost({ title: e.target.value })} /></div>
        <label className="l">Price (HK$)</label>
        <div className="field">
          <span style={{ color: 'var(--g4)' }}>HK$</span>
          <input inputMode="numeric" placeholder="0" value={p.price} onChange={(e) => A.setPost({ price: e.target.value.replace(/\D/g, '') })} />
        </div>
        <label className="l">Category</label>
        {chips('cat', ['Furniture', 'Textbooks', 'Electronics', 'Appliances'])}
        <label className="l">Condition</label>
        {chips('cond', ['Like New', 'Good', 'Fair'])}
        <label className="l">Meetup spot</label>
        {chips('spot', SPOTS.slice(0, 5))}
        <label className="l">Description</label>
        <textarea className="ta" placeholder="Condition, size, reason for selling..." value={p.desc} onChange={(e) => A.setPost({ desc: e.target.value })} />
      </div>
      <div className="footer" style={{ border: 0, paddingTop: 6 }}><button className="btn" onClick={A.publish}>Post Listing</button></div>
      <Tabs active="post" />
    </div>
  )
}

export function Messages() {
  const { s, A } = useApp()
  const ids = Object.keys(s.chats).map(Number).filter((i) => s.chats[i].msgs.length && s.listings.some((l) => l.id === i))
  return (
    <div className="screen">
      <div className="top"><h1>Messages</h1></div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        {ids.length ? (
          ids.map((id) => {
            const x = s.listings.find((l) => l.id === id)!
            const seller = SELLERS[x.s]
            const c = s.chats[id]
            const last = [...c.msgs].reverse().find((m) => !m.sys) ?? c.msgs[c.msgs.length - 1]
            return (
              <button key={id} className="thread" onClick={() => A.openChat(id)}>
                <div className="av">{initials(seller.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="n"><b>{seller.name}</b><span>{last.ts}</span></div>
                  <div className="pv" style={c.unread ? { color: 'var(--ink)', fontWeight: 600 } : undefined}>
                    {last.offer ? 'Offer: ' + money(last.offer) : last.card ? 'Offer accepted' : last.t}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--g4)', marginTop: 2 }}>{x.t}</div>
                </div>
                {c.unread > 0 && <span className="tag k">{c.unread}</span>}
              </button>
            )
          })
        ) : (
          <div className="empty">No messages yet. Open a listing to start a chat.</div>
        )}
      </div>
      <Tabs active="messages" />
    </div>
  )
}

export function Profile() {
  const { s, A } = useApp()
  const mine = s.listings.filter((x) => x.mine)
  const name = s.email ? s.email.split('@')[0] : 'you'
  const init = (name.replace(/[^a-z]/gi, '').slice(0, 2) || 'Me').toUpperCase()
  return (
    <div className="screen">
      <div className="top">
        <h1>Profile</h1>
        <button className="ib" aria-label="Notifications" onClick={() => A.toast('Settings are not part of this mock up')}><Icon n="bell" s={22} /></button>
      </div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div className="center" style={{ padding: '6px 0 18px' }}>
          <div className="av l" style={{ margin: '0 auto 10px' }}>{init}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{name}</div>
          <div style={{ marginTop: 6 }}><span className="tag"><Icon n="shield" s={13} /> CityU Verified</span></div>
        </div>
        <div className="row">
          <div className="stat"><b>{mine.length}</b><span>Listings</span></div>
          <div className="stat"><b>{s.fav.length}</b><span>Saved</span></div>
          <div className="stat"><b>4.8</b><span>Rating</span></div>
        </div>
        <div className="sec-t">My listings</div>
        {mine.length ? (
          <div className="grid" style={{ marginTop: 0 }}>
            {mine.map((x) => (
              <button key={x.id} className="card" onClick={() => A.openListing(x.id)}>
                <div className="ph"><ImgPlaceholder /></div>
                <div className="b"><div className="t">{x.t}</div><div className="p" style={{ marginBottom: 0 }}>{money(x.p)}</div></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="hint" style={{ margin: 0 }}>Nothing posted yet. Tap Post to list your first item.</div>
        )}
        <div className="sec-t">Account</div>
        <div className="list">
          <button className="li" onClick={() => A.toast('Saved items are not part of this mock up')}><Icon n="heart" s={20} /><span className="s">Saved items</span></button>
          <button className="li" onClick={() => A.toast('Help is not part of this mock up')}><Icon n="help" s={20} /><span className="s">Help and safety tips</span></button>
          <button className="li" onClick={A.logout}><Icon n="out" s={20} /><span className="s">Log out</span></button>
        </div>
      </div>
      <Tabs active="profile" />
    </div>
  )
}

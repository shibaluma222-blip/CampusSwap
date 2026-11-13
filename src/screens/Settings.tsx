import { useState, type ReactNode } from 'react'
import { CONTACT_EMAIL, HALLS, initials } from '../data'
import { Icon, type IconName } from '../icons'
import { profileOf, useApp } from '../store'
import type { InfoKey } from '../types'

function Header({ title }: { title: string }) {
  const { A } = useApp()
  return (
    <div className="top">
      <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
      <h2>{title}</h2>
      <div style={{ width: 40 }} />
    </div>
  )
}

function Row({ icon, label, value, onClick }: { icon: IconName; label: string; value?: string; onClick?: () => void }) {
  return (
    <button className="li" onClick={onClick} disabled={!onClick} style={onClick ? undefined : { cursor: 'default' }}>
      <Icon n={icon} s={20} />
      <span className="s">{label}</span>
      {value && <span className="sub">{value}</span>}
      {onClick && <Icon n="chev" s={18} />}
    </button>
  )
}

export function Settings() {
  const { s, A } = useApp()
  const me = profileOf(s, s.userId)
  return (
    <div className="screen">
      <Header title="Settings" />
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div className="seller" style={{ marginBottom: 6 }}>
          <div className="av">{initials(me.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 650, fontSize: 16 }}>{me.name}</div>
            <div className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
            <div style={{ marginTop: 6 }}><span className="tag"><Icon n="shield" s={13} /> CityU Verified</span></div>
          </div>
        </div>

        <div className="sec-t">Account</div>
        <div className="list">
          <Row icon="user" label="Edit profile" value={me.hall} onClick={() => A.go('editProfile')} />
          <Row icon="shield" label="Password" value={s.hasPw ? 'Set' : 'Not set'} onClick={() => A.go('password')} />
          <Row icon="block" label="Blocked users" value={s.blocked.length ? String(s.blocked.length) : undefined} onClick={() => A.setSheet('blocked')} />
        </div>

        <div className="sec-t">Safety and help</div>
        <div className="list">
          <Row icon="shield" label="Safety tips" onClick={() => A.openInfo('safety')} />
          <Row icon="help" label="Help and FAQ" onClick={() => A.openInfo('help')} />
        </div>

        <div className="sec-t">About</div>
        <div className="list">
          <Row icon="tag" label="Terms and privacy" onClick={() => A.openInfo('terms')} />
          <Row icon="cap" label="Version" value={`0.1 (${__BUILD__})`} />
        </div>

        <div className="sec-t">Session</div>
        <div className="list">
          <Row icon="out" label="Log out" onClick={A.logout} />
          <Row icon="x" label="Delete my account" onClick={() => A.setSheet('deleteAccount')} />
        </div>
      </div>
    </div>
  )
}

export function EditProfile() {
  const { s, A } = useApp()
  const me = profileOf(s, s.userId)
  const [name, setName] = useState(me.name)
  const [hall, setHall] = useState<string | null>(me.hall || null)
  const [busy, setBusy] = useState(false)
  const changed = name.trim() !== me.name || (hall ?? '') !== me.hall
  return (
    <div className="screen">
      <Header title="Edit profile" />
      <div className="scroll" style={{ paddingTop: 0 }}>
        <label className="l" style={{ marginTop: 6 }}>Display name</label>
        <div className="field"><input value={name} maxLength={30} placeholder="Your name" onChange={(e) => setName(e.target.value)} /></div>
        <div className="hint">Other students see this name on your listings and in chats.</div>
        <label className="l">Hall</label>
        <div className="chips wrap">
          {HALLS.map((h) => (
            <button key={h} className={'chip ' + (hall === h ? 'on' : '')} onClick={() => setHall(h)}>{h}</button>
          ))}
        </div>
        <label className="l">CityU email</label>
        <div className="field" style={{ background: 'var(--g1)' }}><input value={s.email} readOnly /></div>
        <div className="hint">Your email is your verified identity, so it cannot be changed.</div>
      </div>
      <div className="footer">
        <button
          className="btn"
          disabled={!changed || !name.trim() || busy}
          onClick={async () => {
            setBusy(true)
            if (await A.saveProfile(name, hall)) A.back()
            setBusy(false)
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export function SetPassword() {
  const { s, A } = useApp()
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = pw.length >= 8 && pw === pw2 && (!s.hasPw || cur.length > 0)
  return (
    <div className="screen">
      <Header title="Password" />
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div className="hint" style={{ marginTop: 6 }}>Set a password and you can sign in with it next time, with no email code. You can still use an email code any time.</div>
        {s.hasPw && (
          <>
            <label className="l">Current password</label>
            <div className="field"><input type="password" autoComplete="current-password" placeholder="Your current password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
            <div className="hint">Forgot it? Log out, sign in with an email code, then set a new password.</div>
          </>
        )}
        <label className="l">New password</label>
        <div className="field"><input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <label className="l">Confirm password</label>
        <div className="field"><input type="password" autoComplete="new-password" placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        {pw2 && pw !== pw2 && <div className="hint" style={{ color: 'var(--ink)', fontWeight: 600 }}>Passwords do not match.</div>}
        <div className="hint">Use a password you do not use anywhere else.</div>
      </div>
      <div className="footer">
        <button
          className="btn"
          disabled={!ok || busy}
          onClick={async () => {
            setBusy(true)
            if (await A.savePassword(pw, cur)) A.back()
            setBusy(false)
          }}
        >
          Save password
        </button>
        {!s.hasPw && <button className="sub" style={{ display: 'block', margin: '12px auto 0', textDecoration: 'underline' }} onClick={A.back}>Skip for now</button>}
      </div>
    </div>
  )
}

const H = ({ children }: { children: ReactNode }) => <div className="sec-t">{children}</div>
const P = ({ children }: { children: ReactNode }) => <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--g5)', margin: '0 0 8px' }}>{children}</p>
const Li = ({ children }: { children: ReactNode }) => (
  <li style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--g5)', margin: '0 0 8px' }}>{children}</li>
)

function Safety() {
  return (
    <>
      <P>Most trades go smoothly. These habits keep it that way.</P>
      <H>Meeting</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>Meet in the shared hall areas listed on the listing, such as the lobby or study lounge. Do not invite buyers or sellers to your room.</Li>
        <Li>Pick a time when other people are around.</Li>
        <Li>For big items, bring a friend.</Li>
      </ul>
      <H>Before you pay</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>Check the item first. Electronics should be turned on and tested.</Li>
        <Li>Agree the price in the chat, so there is a record of it.</Li>
        <Li>Be careful if the price looks too good, or someone pushes you to hurry.</Li>
      </ul>
      <H>Handover code</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>The buyer shows the QR code or the 12 character code only when you are face to face and happy with the item.</Li>
        <Li>Never send the code in a message or screenshot. Whoever has it can complete the deal.</Li>
      </ul>
      <H>If something is wrong</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>Use the three dots on a listing or chat to report it or block the user.</Li>
        <Li>For anything urgent, contact hall staff or campus security.</Li>
      </ul>
    </>
  )
}

const FAQ: [string, string][] = [
  ['I did not get my login code', 'Check your junk or spam folder first. The email comes from CampusSwap and can take a minute. You can request a new code from the login screen.'],
  ['How does a trade work?', 'Open a listing, chat with the seller and make an offer. When the seller accepts, pick a lobby spot and time. At pickup the buyer shows a QR code and the seller scans it. Then the buyer can rate the seller.'],
  ['The seller cannot scan my QR code', 'The seller can type the 12 character code shown under the QR instead.'],
  ['Can I change my email?', 'No. Your CityU email is your verified identity. You can change your name and hall in Edit profile.'],
  ['How do I remove a listing?', 'Open your listing and tap Remove my listing. You can find your listings in Profile.'],
  ['Someone is bothering me', 'Block them from the three dots menu. They can no longer message you or see your listings. You can also report them so a moderator can review it.'],
]

function Help() {
  return (
    <>
      {FAQ.map(([q, a]) => (
        <div key={q} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 650, fontSize: 15, marginBottom: 4 }}>{q}</div>
          <P>{a}</P>
        </div>
      ))}
      <H>Still stuck?</H>
      <P>Email us and we will get back to you.</P>
      <a className="btn sec" href={`mailto:${CONTACT_EMAIL}?subject=CampusSwap%20help`} style={{ textDecoration: 'none' }}>
        <Icon n="mail" s={20} /> {CONTACT_EMAIL}
      </a>
    </>
  )
}

function Terms() {
  return (
    <>
      <P>CampusSwap is a student project for CityU MOS residence students. It is not an official CityU service. This is a plain language summary for the course demo, not a legal document.</P>
      <H>What we store</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>Your CityU email, display name and hall.</Li>
        <Li>Your listings and their photos, your favourites and your ratings.</Li>
        <Li>Your chats and offers with other students.</Li>
        <Li>Reports and blocks you make.</Li>
      </ul>
      <H>Who can see it</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>Other signed in students see your name, hall, rating, number of trades and your active listings.</Li>
        <Li>Only the two people in a chat see its messages. Moderators see reports, not chats.</Li>
        <Li>Your email is not shown to other students.</Li>
      </ul>
      <H>Community rules</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>Only list items and services that are yours to sell and legal on campus.</Li>
        <Li>No harassment, scams or fake listings. Moderators can remove listings after a report.</Li>
        <Li>Meet in shared hall areas and use the in-app handover code.</Li>
      </ul>
      <H>Your data</H>
      <ul style={{ paddingLeft: 20 }}>
        <Li>You can delete your account in Settings. This removes your profile, listings, chats, favourites and ratings.</Li>
        <Li>Photo files may stay in storage for a short time after deletion until they are cleaned up.</Li>
        <Li>We do not charge fees, run ads or sell data.</Li>
      </ul>
      <P>Questions? {CONTACT_EMAIL}</P>
    </>
  )
}

const TITLES: Record<InfoKey, string> = { safety: 'Safety tips', help: 'Help and FAQ', terms: 'Terms and privacy' }

export function Info() {
  const { s } = useApp()
  return (
    <div className="screen">
      <Header title={TITLES[s.info]} />
      <div className="scroll" style={{ paddingTop: 0 }}>
        {s.info === 'safety' && <Safety />}
        {s.info === 'help' && <Help />}
        {s.info === 'terms' && <Terms />}
      </div>
    </div>
  )
}

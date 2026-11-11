import { useEffect, useState } from 'react'
import { ago, initials, money } from '../data'
import { Icon } from '../icons'
import { profileOf, useApp } from '../store'
import type { Report } from '../types'

const REASON_LABEL: Record<string, string> = {
  spam: 'Spam or fake listing',
  scam: 'Scam or suspicious',
  prohibited: 'Prohibited item or service',
  harassment: 'Harassment or abuse',
  other: 'Something else',
}

function ReportCard({ r }: { r: Report }) {
  const { s, A } = useApp()
  const [note, setNote] = useState('')
  const listing = r.listingId ? s.listings.find((l) => l.id === r.listingId) : undefined
  const reported = profileOf(s, r.reportedUserId)
  const open = r.status === 'open'
  return (
    <div className="deal" style={{ alignSelf: 'stretch', margin: '0 0 12px', borderColor: open ? 'var(--ink)' : 'var(--g3)' }}>
      <small>{REASON_LABEL[r.reason]} · {ago(r.createdAt)}</small>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
        <div className="av s">{initials(reported.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 650 }}>{reported.name}</div>
          <div className="sub">Reported by {profileOf(s, r.reporterId).name}</div>
        </div>
      </div>
      {r.listingId && (
        <div className="sub" style={{ marginBottom: 6 }}>
          Listing: {listing ? `${listing.t} (${money(listing.p, listing.unit)}) · ${listing.status}` : 'deleted'}
        </div>
      )}
      {r.details && <div style={{ fontSize: 14, margin: '4px 0 8px', color: 'var(--g5)' }}>"{r.details}"</div>}
      {open ? (
        <>
          <div className="field" style={{ height: 42, margin: '8px 0' }}>
            <input placeholder="Note (optional)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {listing && listing.status === 'active' && (
              <button className="btn sm" style={{ flex: '1 1 100%' }} onClick={() => void A.resolveReport(r.id, 'remove_listing', note)}>Remove listing</button>
            )}
            <button className="btn sm sec" style={{ flex: '1 1 0', width: 'auto' }} onClick={() => void A.resolveReport(r.id, 'dismiss', note)}>Dismiss</button>
            <button className="btn sm sec" style={{ flex: '1 1 0', width: 'auto' }} onClick={() => void A.resolveReport(r.id, 'resolve', note)}>Mark resolved</button>
          </div>
        </>
      ) : (
        <div className="sub"><span style={{ fontWeight: 700 }}>{r.status === 'dismissed' ? 'Dismissed' : 'Resolved'}</span>{r.adminNote ? `: ${r.adminNote}` : ''}</div>
      )}
    </div>
  )
}

export function Admin() {
  const { s, A } = useApp()
  const me = s.userId ? s.sellers[s.userId] : undefined
  useEffect(() => {
    void A.loadReports()
  }, [A])
  const open = s.reports.filter((r) => r.status === 'open')
  const done = s.reports.filter((r) => r.status !== 'open')
  return (
    <div className="screen">
      <div className="top">
        <button className="ib" aria-label="Back" onClick={A.back}><Icon n="back" /></button>
        <h2>Moderation</h2>
        <button className="ib" aria-label="Refresh" onClick={() => void A.loadReports()}><Icon n="clock" s={22} /></button>
      </div>
      <div className="scroll">
        {!me?.admin ? (
          <div className="empty">Admins only.</div>
        ) : (
          <>
            <div className="sec-t" style={{ marginTop: 6 }}>Open reports ({open.length})</div>
            {open.length ? open.map((r) => <ReportCard key={r.id} r={r} />) : <div className="hint" style={{ margin: 0 }}>Nothing to review.</div>}
            {done.length > 0 && <div className="sec-t">Handled ({done.length})</div>}
            {done.map((r) => <ReportCard key={r.id} r={r} />)}
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { isDemoEmail } from '../data'
import { Icon } from '../icons'
import { useApp } from '../store'

const KEY = 'cs_otp_sent'
const COOLDOWN = 30
const remaining = (): { left: number; email: string } => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { at: number; email: string } | null
    if (!v) return { left: 0, email: '' }
    return { left: Math.max(0, COOLDOWN - Math.floor((Date.now() - v.at) / 1000)), email: v.email }
  } catch {
    return { left: 0, email: '' }
  }
}

// Must match Supabase Auth > Providers > Email > OTP length
const OTP_LEN = 8

export function Login() {
  const { s, A, patch } = useApp()
  const [email, setEmail] = useState(s.email)
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(''))
  const [pw, setPw] = useState('')
  const [usePw, setUsePw] = useState(false)
  const [sending, setSending] = useState(false)
  const [wait, setWait] = useState(() => remaining().left)

  // After a refresh, keep the cooldown and go back to the code boxes instead of letting the user request another code.
  useEffect(() => {
    const r = remaining()
    if (r.left > 0 && r.email && !s.otpStage) {
      setEmail(r.email)
      patch({ otpStage: true, email: r.email })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const demo = isDemoEmail(email)
  const pwMode = demo || usePw
  const refs = useRef<(HTMLInputElement | null)[]>([])

  // Supabase allows one code per address every ~25 s, so the resend button waits 30 s.
  useEffect(() => {
    if (wait <= 0) return
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(id)
  }, [wait])

  const send = async () => {
    if (sending || wait > 0) return
    setSending(true)
    const ok = await A.sendCode(email)
    setSending(false)
    if (ok) {
      try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), email: email.trim().toLowerCase() })) } catch { /* private mode */ }
      setWait(COOLDOWN)
      setDigits(Array(OTP_LEN).fill(''))
    }
  }

  const submit = (next: string[]) => {
    if (next.every(Boolean)) {
      void A.verifyCode(email, next.join('')).then((ok) => {
        if (ok) return
        setDigits(Array(OTP_LEN).fill(''))
        refs.current[0]?.focus()
      })
    }
  }

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, j) => (j === i ? v : d))
    setDigits(next)
    if (v && i < OTP_LEN - 1) refs.current[i + 1]?.focus()
    submit(next)
  }

  const paste = (text: string) => {
    const ds = text.replace(/\D/g, '').slice(0, OTP_LEN).split('')
    if (!ds.length) return
    const next = Array.from({ length: OTP_LEN }, (_, j) => ds[j] ?? '')
    setDigits(next)
    refs.current[Math.min(ds.length, OTP_LEN - 1)]?.focus()
    submit(next)
  }

  return (
    <div className="screen">
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 60 }}>
        <div className="logo"><Icon n="cap" s={46} w={1.6} /></div>
        <div className="center">
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>CampusSwap</div>
          <div className="sub" style={{ marginTop: 4 }}>Buy · Sell · Connect</div>
        </div>
        <div style={{ marginTop: 44 }}>
          <div className={'field ' + (s.emailErr ? 'err' : '')}>
            <Icon n="mail" s={20} />
            <input
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="CityU Student Email"
              value={email}
              readOnly={s.otpStage}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !s.otpStage && !pwMode && void send()}
            />
          </div>
          {s.emailErr && (
            <div className="hint" style={{ color: 'var(--ink)', fontWeight: 600 }}>
              Use your CityU email (@my.cityu.edu.hk or @cityu.edu.hk).
            </div>
          )}
          {pwMode && !s.otpStage && (
            <div className="field" style={{ marginTop: 10 }}>
              <Icon n="shield" s={20} />
              <input type="password" placeholder="Password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void A.passwordLogin(email, pw)} />
            </div>
          )}
          {!s.otpStage ? (
            <button className="btn" style={{ marginTop: 14 }} disabled={sending || (!pwMode && wait > 0)} onClick={() => (pwMode ? void A.passwordLogin(email, pw) : void send())}>{sending ? 'Sending...' : pwMode ? 'Sign in' : wait > 0 ? `Please wait ${wait}s` : 'Send Code'}</button>
          ) : (
            <>
              <div className="sub center" style={{ margin: '22px 0 12px' }}>Code sent. It can take 1 to 2 minutes. Enter the 8 digits</div>
              <div className="otp">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el }}
                    className={d ? 'f' : ''}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onPaste={(e) => { e.preventDefault(); paste(e.clipboardData.getData('text')) }}
                    onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                  />
                ))}
              </div>
              <div className="row" style={{ marginTop: 16, justifyContent: 'center' }}>
                <button className="sub" style={{ textDecoration: 'underline' }} disabled={sending || wait > 0} onClick={() => void send()}>{sending ? 'Sending...' : wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
                <button className="sub" style={{ textDecoration: 'underline' }} onClick={() => { setDigits(Array(OTP_LEN).fill('')); patch({ otpStage: false }) }}>Change email</button>
              </div>
            </>
          )}
          {!s.otpStage && !demo && (
            <button className="sub" style={{ display: 'block', margin: '14px auto 0', textDecoration: 'underline' }} onClick={() => setUsePw(!usePw)}>
              {usePw ? 'Email me a code instead' : 'Sign in with password'}
            </button>
          )}
          {usePw && !s.otpStage && <div className="hint center">First time, or forgot it? Use an email code, then set a new password in Settings.</div>}
          <div className="hint center" style={{ marginTop: 22 }}>Verified CityU students only.</div>
          {s.otpStage && <div className="demo">Use the newest email only: each new code replaces the old one. No email? Check your junk folder.</div>}
        </div>
      </div>
    </div>
  )
}

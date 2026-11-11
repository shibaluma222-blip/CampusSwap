import { useRef, useState } from 'react'
import { Icon } from '../icons'
import { useApp } from '../store'
import { supabase } from '../supabase'

const DEMO = !supabase

export function Login() {
  const { s, A, patch } = useApp()
  const [email, setEmail] = useState(s.email)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, j) => (j === i ? v : d))
    setDigits(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    if (next.every(Boolean)) {
      void A.verifyCode(email, next.join('')).then((ok) => {
        if (ok) return
        setDigits(['', '', '', '', '', ''])
        refs.current[0]?.focus()
      })
    }
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
              onKeyDown={(e) => e.key === 'Enter' && !s.otpStage && A.sendCode(email)}
            />
          </div>
          {s.emailErr && (
            <div className="hint" style={{ color: 'var(--ink)', fontWeight: 600 }}>
              Use your CityU email (@my.cityu.edu.hk or @cityu.edu.hk).
            </div>
          )}
          {!s.otpStage ? (
            <button className="btn" style={{ marginTop: 14 }} onClick={() => A.sendCode(email)}>Send Code</button>
          ) : (
            <>
              <div className="sub center" style={{ margin: '22px 0 12px' }}>Enter the 6-digit code we sent to your inbox</div>
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
                    onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                  />
                ))}
              </div>
              <div className="row" style={{ marginTop: 16, justifyContent: 'center' }}>
                <button className="sub" style={{ textDecoration: 'underline' }} onClick={() => A.toast('Code resent')}>Resend code</button>
                <button className="sub" style={{ textDecoration: 'underline' }} onClick={() => { setDigits(['', '', '', '', '', '']); patch({ otpStage: false }) }}>Change email</button>
              </div>
            </>
          )}
          <div className="hint center" style={{ marginTop: 22 }}>Verified CityU students only.</div>
          {DEMO && <div className="demo">{s.otpStage ? 'Demo: any 6 digits will work' : 'Demo: type any @my.cityu.edu.hk address'}</div>}
        </div>
      </div>
    </div>
  )
}

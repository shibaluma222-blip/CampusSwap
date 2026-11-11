import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'

/** Camera QR scanner. Needs HTTPS (or localhost) and camera permission. */
export function Scanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [err, setErr] = useState('')
  const cb = useRef(onResult)
  useEffect(() => {
    cb.current = onResult
  })

  useEffect(() => {
    let stream: MediaStream | undefined
    let raf = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    let last = 0

    const tick = (ts: number) => {
      const v = video.current
      if (stopped || !v) return
      if (ts - last > 120 && v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
        last = ts
        const w = 480
        const h = Math.round((v.videoHeight / v.videoWidth) * w)
        canvas.width = w
        canvas.height = h
        ctx.drawImage(v, 0, 0, w, h)
        const hit = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)
        if (hit?.data) {
          stopped = true
          cb.current(hit.data)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('Camera is not available here. Use the code instead.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop())
        stream = s
        const v = video.current!
        v.srcObject = s
        await v.play()
        raf = requestAnimationFrame(tick)
      })
      .catch(() => setErr('Could not open the camera. Allow camera access, or enter the code instead.'))

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="scan">
      <video ref={video} playsInline muted />
      <div className="frame" />
      <div className="msg">{err || 'Point the camera at the buyer\'s QR code'}</div>
      <button className="btn sec" onClick={onClose}>Close</button>
    </div>
  )
}

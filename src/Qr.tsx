import QRCode from 'qrcode'
import { useMemo } from 'react'

/** Real, scannable QR code rendered as SVG rects (no innerHTML). */
export function Qr({ value }: { value: string }) {
  const m = useMemo(() => QRCode.create(value, { errorCorrectionLevel: 'M' }).modules, [value])
  const n = m.size
  const cells: React.JSX.Element[] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m.get(y, x)) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} fill="#111" shapeRendering="crispEdges" role="img" aria-label="Handover QR code">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      {cells}
    </svg>
  )
}

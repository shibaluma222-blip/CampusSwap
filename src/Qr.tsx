// Decorative placeholder QR. Real token-based QR comes with the Supabase handover wiring.
function makeCells(seed: string, N: number) {
  let h = 2166136261
  for (const c of seed) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  const rnd = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return (h >>> 0) / 4294967296
  }
  const fin = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fin(x, y) && rnd() > 0.52) cells.push({ x, y })
  return cells
}

export function Qr({ seed }: { seed: string }) {
  const N = 25
  const cells = makeCells(seed, N)
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <path fillRule="evenodd" d={`M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z`} />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${N} ${N}`} fill="#111" shapeRendering="crispEdges">
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" />
      ))}
    </svg>
  )
}

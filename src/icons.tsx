const P = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  plus: 'M12 5v14M5 12h14',
  chat: 'M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.5-4.5',
  back: 'M15 5l-7 7 7 7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-5',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  pin: 'M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  send: 'M4 12l16-8-6 17-3-7z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  tune: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  block: 'M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  x: 'M6 6l12 12M18 6L6 18',
  cap: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
  cam: 'M4 8h3l1.5-2h7L17 8h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  out: 'M10 4H4v16h6M15 8l4 4-4 4M19 12H9',
  tag: 'M3 12V3h9l9 9-9 9z M7.5 7.5h.01',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
  chev: 'M9 5l7 7-7 7',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1-1.5 2M12 17h.01',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
} as const

export type IconName = keyof typeof P

interface IconProps {
  n: IconName
  s?: number
  f?: string
  w?: number
}

export function Icon({ n, s = 24, f = 'none', w = 1.8 }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={f}
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={P[n]} />
    </svg>
  )
}

export function ImgPlaceholder() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <circle cx="40" cy="18" r="5" />
      <path d="M6 52l16-22 10 13 7-8 19 17z" />
    </svg>
  )
}

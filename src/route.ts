import type { Screen } from './types'

export interface Route {
  screen: Screen
  cur?: number
  thread?: number
}

const SIMPLE: Partial<Record<Screen, string>> = {
  home: '/',
  post: '/post',
  messages: '/messages',
  profile: '/profile',
  saved: '/saved',
  settings: '/settings',
  admin: '/admin',
}

/** URL hash for a screen, or null when the screen has no address of its own (forms, sheets, sub pages). */
export function hashFor(screen: Screen, cur: number, thread: number | null): string | null {
  if (screen === 'detail') return `#/listing/${cur}`
  if (screen === 'chat') return thread ? `#/chat/${thread}` : null
  const p = SIMPLE[screen]
  return p ? '#' + p : null
}

/** null = unknown address (404). */
export function parseHash(hash: string): Route | null {
  const h = hash.replace(/^#/, '').replace(/\/+$/, '') || '/'
  for (const [screen, path] of Object.entries(SIMPLE)) if (path === h) return { screen: screen as Screen }
  let m = /^\/listing\/(\d+)$/.exec(h)
  if (m) return { screen: 'detail', cur: Number(m[1]) }
  m = /^\/chat\/(\d+)$/.exec(h)
  if (m) return { screen: 'chat', thread: Number(m[1]) }
  return null
}

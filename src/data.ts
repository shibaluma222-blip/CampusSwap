import type { ListingType } from './types'

export const CATS: Record<ListingType, string[]> = {
  goods: ['All', 'Furniture', 'Textbooks', 'Electronics', 'Appliances'],
  services: ['All', 'Moving', 'Tutoring', 'Personal', 'Design'],
}

export const SPOTS = ['Hall Lobby', 'Block A Lobby', 'Block B Lobby', 'Block C Lobby', 'Study Lounge G/F', 'Mailroom']

export const initials = (n: string) =>
  n
    .split(' ')
    .map((x) => x[0])
    .join('')

export const money = (p: number, u?: string) => 'HK$' + p.toLocaleString('en-US') + (u ?? '')

export const now = () => {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const ALLOWED_EMAIL = /^[^@\s]+@((my\.)?cityu\.edu\.hk|demo\.campusswap\.test)$/
export const isDemoEmail = (e: string) => e.trim().toLowerCase().endsWith('@demo.campusswap.test')

export const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 2) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

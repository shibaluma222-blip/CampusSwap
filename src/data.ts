import type { ListingType } from './types'

export const CATS: Record<ListingType, string[]> = {
  goods: ['All', 'Furniture', 'Textbooks', 'Electronics', 'Appliances', 'Other'],
  services: ['All', 'Moving', 'Tutoring', 'Personal', 'Design', 'Other'],
}

export const SPOTS = ['Hall Lobby', 'Block A Lobby', 'Block B Lobby', 'Block C Lobby', 'Study Lounge G/F', 'Mailroom']

export const initials = (n: string) => {
  const w = n.trim().split(/\s+/).filter(Boolean)
  return (w.length > 1 ? w.map((x) => x[0]).join('') : (w[0] ?? '').slice(0, 2)).toUpperCase()
}

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

export const clock = (iso: string) => {
  const d = new Date(iso)
  const time = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`
  return d.toDateString() === new Date().toDateString() ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

export const HALLS = ['Block A', 'Block B', 'Block C']
export const CONTACT_EMAIL = 'chwong922-c@my.cityu.edu.hk'

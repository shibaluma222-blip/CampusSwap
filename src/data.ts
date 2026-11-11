import type { Listing, ListingType, Seller } from './types'

export const SELLERS: Record<string, Seller> = {
  alex: { name: 'Alex Chen', r: 4.9, n: 23, hall: 'Block A' },
  mei: { name: 'Mei Wong', r: 4.7, n: 11, hall: 'Block B' },
  jason: { name: 'Jason Lam', r: 4.8, n: 17, hall: 'Block A' },
  priya: { name: 'Priya Shah', r: 4.6, n: 8, hall: 'Block C' },
  kenji: { name: 'Kenji Ito', r: 5.0, n: 5, hall: 'Block B' },
  sam: { name: 'Sam Ho', r: 4.5, n: 14, hall: 'Block C' },
}

export const SEED_LISTINGS: Listing[] = [
  { id: 1, t: 'Ergonomic Study Chair', p: 350, cond: 'Like New', cat: 'Furniture', type: 'goods', s: 'alex', d: 'Comfortable ergonomic study chair, used for only 3 months. Great condition, no scratches. Adjustable height and lumbar support. Perfect for long study nights.', spots: ['Hall Lobby', 'Block A Lobby'], age: '2h ago' },
  { id: 2, t: 'Accounting Textbook Set (Yr 1)', p: 180, cond: 'Good', cat: 'Textbooks', type: 'goods', s: 'mei', d: 'Three Year 1 accounting textbooks, light highlighting in chapters 1 to 4. Selling as a bundle only.', spots: ['Study Lounge G/F', 'Hall Lobby'], age: '5h ago' },
  { id: 3, t: 'MacBook Air M1 (2021)', p: 4200, cond: 'Good', cat: 'Electronics', type: 'goods', s: 'jason', d: '8GB / 256GB, battery health 87%. Comes with charger and sleeve. Minor wear on the corners. Happy to let you test it in the lobby.', spots: ['Hall Lobby'], age: '1d ago' },
  { id: 4, t: 'LED Desk Lamp', p: 60, cond: 'Like New', cat: 'Electronics', type: 'goods', s: 'priya', d: 'Dimmable LED lamp with 3 colour modes and a USB charging port. Bought in August, barely used.', spots: ['Block C Lobby', 'Mailroom'], age: '3h ago' },
  { id: 5, t: 'Mini Fridge (45L)', p: 450, cond: 'Good', cat: 'Appliances', type: 'goods', s: 'kenji', d: 'Compact fridge, fits a single room. Works perfectly, moving out so need it gone by Friday. Bring a friend to carry it.', spots: ['Block B Lobby'], age: '6h ago' },
  { id: 6, t: 'Rice Cooker (3 cups)', p: 90, cond: 'Fair', cat: 'Appliances', type: 'goods', s: 'sam', d: 'Basic rice cooker with steam tray. Some scratches on the lid, works fine.', spots: ['Block C Lobby', 'Hall Lobby'], age: '2d ago' },
  { id: 7, t: 'Bookshelf (5 tier)', p: 220, cond: 'Good', cat: 'Furniture', type: 'goods', s: 'mei', d: 'White 5 tier shelf, easy to disassemble. Holds a lot more books than you think.', spots: ['Block B Lobby'], age: '1d ago' },
  { id: 8, t: 'Move-out Helper (carry + trolley)', p: 120, unit: '/hr', cond: 'Service', cat: 'Moving', type: 'services', s: 'jason', d: 'Two helpers with a trolley, can move between floors in the same hall. Book at least 1 day ahead. Minimum 1 hour.', spots: ['Hall Lobby'], age: '4h ago' },
  { id: 9, t: 'Calculus I Tutoring', p: 150, unit: '/hr', cond: 'Service', cat: 'Tutoring', type: 'services', s: 'priya', d: 'Year 3 math student, got an A in MA1200. Sessions in the study lounge. First 30 minutes free for new students.', spots: ['Study Lounge G/F'], age: '1d ago' },
  { id: 10, t: 'Haircut (in-room)', p: 60, cond: 'Service', cat: 'Personal', type: 'services', s: 'kenji', d: "Simple men's cuts, clippers and scissors. Takes about 30 minutes. Book through chat.", spots: ['Hall Lobby'], age: '3d ago' },
  { id: 11, t: 'Poster Design for Hall Events', p: 200, unit: '/poster', cond: 'Service', cat: 'Design', type: 'services', s: 'alex', d: 'Clean posters for society and hall events. Delivered in 2 days as PNG and PDF.', spots: ['Study Lounge G/F'], age: '2d ago' },
]

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

export const CITYU_EMAIL = /^[^@\s]+@(my\.)?cityu\.edu\.hk$/

import { useEffect } from 'react'
import { SheetHost, Toast } from './components'
import { hashFor, parseHash } from './route'
import { Detail, Home } from './screens/Browse'
import { Chat, Confirm, Rate, Schedule } from './screens/Deal'
import { Admin } from './screens/Admin'
import { Login } from './screens/Login'
import { EditProfile, Info, SetPassword, Settings } from './screens/Settings'
import { Messages, Post, Profile, Saved } from './screens/Tabs'
import { AppProvider, useApp } from './store'
import type { ReactNode } from 'react'
import type { Screen } from './types'

const SCREENS: Record<Screen, () => ReactNode> = {
  login: Login,
  home: Home,
  detail: Detail,
  chat: Chat,
  schedule: Schedule,
  confirm: Confirm,
  rate: Rate,
  post: Post,
  messages: Messages,
  profile: Profile,
  admin: Admin,
  saved: Saved,
  settings: Settings,
  editProfile: EditProfile,
  password: SetPassword,
  info: Info,
  notfound: NotFound,
}

function NotFound() {
  const { A } = useApp()
  return (
    <div className="screen">
      <div className="top"><h1>Page not found</h1></div>
      <div className="empty">This page does not exist.</div>
      <div className="footer"><button className="btn" onClick={() => A.tab('home')}>Go to Home</button></div>
    </div>
  )
}

function Shell() {
  const { s, A } = useApp()
  // Keep the address bar in step with the screen so links and refresh work.
  useEffect(() => {
    if (!s.userId || s.editId !== null) return
    const h = hashFor(s.screen, s.cur, s.curThread)
    if (h && h !== (window.location.hash || '#/')) window.history.pushState(null, '', h)
  }, [s.userId, s.screen, s.cur, s.curThread, s.editId])
  useEffect(() => {
    const onPop = () => A.route(parseHash(window.location.hash) ?? { screen: 'notfound' })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [A])
  const Current = SCREENS[s.screen]
  return (
    <div id="phone">
      <div id="status">
        <span>9:41</span>
        <span className="sb">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="#111"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
          <svg width="24" height="12" viewBox="0 0 24 12"><rect x=".5" y=".5" width="20" height="11" rx="3" fill="none" stroke="#111" /><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#111" /><rect x="21.5" y="4" width="2" height="4" rx="1" fill="#111" /></svg>
        </span>
      </div>
      <div id="view">
        <Current key={s.screen} />
        <SheetHost />
        <Toast />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

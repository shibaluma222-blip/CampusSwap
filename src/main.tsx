import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// iOS Safari does not shrink the page when the keyboard opens. It scrolls the visible area up instead (offsetTop),
// so a bottom-anchored chat box ends up at the top of the screen or behind the keyboard.
// Pin the app to the visible area: same height and same top offset as the visual viewport. Skipped while pinch-zoomed.
const vv = window.visualViewport
if (vv) {
  const sync = () => {
    if (Math.abs(vv.scale - 1) > 0.01) return
    const root = document.documentElement.style
    root.setProperty('--app-h', `${Math.round(vv.height)}px`)
    root.setProperty('--app-top', `${Math.round(vv.offsetTop)}px`)
  }
  vv.addEventListener('resize', sync)
  vv.addEventListener('scroll', sync)
  sync()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

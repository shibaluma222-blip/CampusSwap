import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// iOS Safari does not shrink the page when the keyboard opens, so the chat box can end up hidden behind it.
// Track the visible height (above the keyboard) in a CSS variable instead. Skipped while pinch-zoomed.
const vv = window.visualViewport
if (vv) {
  const sync = () => {
    if (Math.abs(vv.scale - 1) > 0.01) return
    document.documentElement.style.setProperty('--app-h', `${Math.round(vv.height)}px`)
    if (vv.offsetTop > 0) window.scrollTo(0, 0)
  }
  vv.addEventListener('resize', sync)
  sync()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

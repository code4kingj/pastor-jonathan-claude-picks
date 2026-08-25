/* ── ThemeDial ────────────────────────────────────────────────────────────────
   Floating design-candidate switcher, present on every page. One clean row
   per design. Visual-only: never touches room state. */

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Palette, X } from 'lucide-react'
import { applyTheme, readStoredTheme, THEMES, type ThemeId } from '../themes'
import { EarMark } from './EarMark'

export function ThemeDial() {
  const [theme, setTheme] = useState<ThemeId>(() => readStoredTheme())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const index = THEMES.findIndex((item) => item.id === theme)
  const active = THEMES[index]

  function step(direction: -1 | 1) {
    const next = THEMES[(index + direction + THEMES.length) % THEMES.length]
    setTheme(next.id)
  }

  return (
    <div className={`theme-dial ${open ? 'open' : ''}`}>
      {open && (
        <div className="theme-panel" role="dialog" aria-label="Choose a design">
          <header>
            <b>Pick a design</b>
            <button className="theme-close" aria-label="Close design picker" onClick={() => setOpen(false)}><X size={16} /></button>
          </header>
          <div className="theme-list">
            {THEMES.map((item) => (
              <button
                key={item.id}
                className={`theme-option ${item.id === theme ? 'active' : ''}`}
                onClick={() => setTheme(item.id)}
              >
                <span className="theme-swatches" aria-hidden="true">
                  {item.swatches.map((color) => <i key={color} style={{ background: color }} />)}
                </span>
                <span className="theme-words">
                  <b>{item.name}</b>
                  <small>{item.vibe}</small>
                </span>
              </button>
            ))}
          </div>
          <footer>
            <button aria-label="Previous design" onClick={() => step(-1)}><ChevronLeft size={17} /></button>
            <span>{index + 1} / {THEMES.length} · {active.source}</span>
            <button aria-label="Next design" onClick={() => step(1)}><ChevronRight size={17} /></button>
          </footer>
        </div>
      )}
      <button className="theme-toggle" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <EarMark size={20} /> <Palette size={16} /> <span>{active.name.split('·')[0].trim()}</span>
      </button>
    </div>
  )
}

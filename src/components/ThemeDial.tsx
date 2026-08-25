/* ── ThemeDial ────────────────────────────────────────────────────────────────
   Floating design switcher, present on every page, one clean row per design.
   Controlled by App so each member's choice syncs to the family room, which
   feeds the live popularity poll shown on each row. Visual-only otherwise. */

import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Crown, Palette, X } from 'lucide-react'
import { useState } from 'react'
import { applyTheme, THEMES, type ThemeId } from '../themes'
import { EarMark } from './EarMark'

export function ThemeDial({
  value,
  onChange,
  poll,
}: {
  value: ThemeId
  onChange: (id: ThemeId) => void
  poll?: Record<string, number>
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    applyTheme(value)
  }, [value])

  const index = THEMES.findIndex((item) => item.id === value)
  const active = THEMES[index] ?? THEMES[0]
  const pollTotal = poll ? Object.values(poll).reduce((sum, count) => sum + count, 0) : 0
  const pollLeader = poll && pollTotal > 0 ? Math.max(...Object.values(poll)) : 0

  function step(direction: -1 | 1) {
    const next = THEMES[(index + direction + THEMES.length) % THEMES.length]
    onChange(next.id)
  }

  return (
    <div className={`theme-dial ${open ? 'open' : ''}`}>
      {open && (
        <div className="theme-panel" role="dialog" aria-label="Choose a design">
          <header>
            <b>Pick a design</b>
            <button className="theme-close" aria-label="Close design picker" onClick={() => setOpen(false)}><X size={16} /></button>
          </header>
          {pollTotal > 0 && <p className="theme-poll-note">Family poll · what {pollTotal} {pollTotal === 1 ? 'member is' : 'members are'} using right now</p>}
          <div className="theme-list">
            {THEMES.map((item) => {
              const votes = poll?.[item.id] ?? 0
              return (
                <button
                  key={item.id}
                  className={`theme-option ${item.id === value ? 'active' : ''}`}
                  onClick={() => onChange(item.id)}
                >
                  <span className="theme-swatches" aria-hidden="true">
                    {item.swatches.map((color) => <i key={color} style={{ background: color }} />)}
                  </span>
                  <span className="theme-words">
                    <b>{item.name}</b>
                    <small>{item.vibe}</small>
                  </span>
                  {pollTotal > 0 && votes > 0 && (
                    <span className={`theme-votes ${votes === pollLeader ? 'leading' : ''}`}>
                      {votes === pollLeader && <Crown size={12} fill="currentColor" />} {votes}
                    </span>
                  )}
                </button>
              )
            })}
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

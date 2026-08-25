/* ── NightSky ─────────────────────────────────────────────────────────────────
   Canvas firework sky for the gate and the family reveal. Original graphics:
   drifting stars + firework bursts whose sparks fall like castle-show embers.
   Honors prefers-reduced-motion (static starfield, no bursts, no rAF loop). */

import { useEffect, useRef } from 'react'

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: string }
type Star = { x: number; y: number; r: number; tw: number }

const HUES = ['#ffc72c', '#e3273d', '#7ab8ff', '#ff9de2', '#9dffc7']

/* each design candidate shoots its own firework colors */
const THEME_HUES: Record<string, string[]> = {
  minnie: ['#ff9ec0', '#e42a63', '#ffffff', '#ffd3e2', '#ffc72c'],
  oswald: ['#f4ead8', '#7fa8d0', '#2f5f8f', '#d9b13b', '#ffffff'],
  'oswald-bw': ['#ffffff', '#dddddd', '#bbbbbb', '#f2f2f2', '#999999'],
  buzz: ['#b6f542', '#8d6fe8', '#ffffff', '#d5c8ff', '#7ab8ff'],
  cheshire: ['#e4569f', '#b06cf0', '#f9c8ff', '#8a5cff', '#ffffff'],
  goofy: ['#f28c28', '#9fdc7a', '#fdf6e3', '#ffd97a', '#6fcf97'],
}

function currentHues() {
  return THEME_HUES[document.documentElement.dataset.theme ?? ''] ?? HUES
}

export function NightSky({ fireworks = true }: { fireworks?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let stars: Star[] = []
    let sparks: Spark[] = []
    let tick = 0

    function fit() {
      const c = ref.current
      if (!c) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = c.clientWidth * dpr
      c.height = c.clientHeight * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars = Array.from({ length: 110 }, () => ({
        x: Math.random() * c.clientWidth,
        y: Math.random() * c.clientHeight,
        r: Math.random() * 1.4 + 0.4,
        tw: Math.random() * Math.PI * 2,
      }))
    }

    function burst(w: number, h: number) {
      const cx = w * (0.15 + Math.random() * 0.7)
      const cy = h * (0.12 + Math.random() * 0.45)
      const hues = currentHues()
      const hue = hues[Math.floor(Math.random() * hues.length)]
      const n = 44 + Math.floor(Math.random() * 26)
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.12
        const v = 1.1 + Math.random() * 2.4
        sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 60 + Math.random() * 30, hue })
      }
    }

    function paintStars(w: number, h: number, t: number) {
      ctx!.clearRect(0, 0, w, h)
      for (const s of stars) {
        const a = reduce ? 0.7 : 0.35 + 0.45 * Math.abs(Math.sin(t / 60 + s.tw))
        ctx!.globalAlpha = a
        ctx!.fillStyle = '#ffffff'
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function frame() {
      const c = ref.current
      if (!c) return
      const w = c.clientWidth
      const h = c.clientHeight
      tick++
      paintStars(w, h, tick)

      if (fireworks) {
        if (tick % 110 === 30 || (tick % 170 === 80 && Math.random() > 0.4)) burst(w, h)
        for (const p of sparks) {
          p.life++
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.028 /* gravity: sparks fall */
          p.vx *= 0.985
          const fade = 1 - p.life / p.max
          if (fade <= 0) continue
          ctx!.globalAlpha = fade
          ctx!.fillStyle = p.hue
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, 1.6 + fade, 0, Math.PI * 2)
          ctx!.fill()
        }
        ctx!.globalAlpha = 1
        sparks = sparks.filter((p) => p.life < p.max)
      }

      raf = window.requestAnimationFrame(frame)
    }

    fit()
    if (reduce) {
      /* one static, dignified paint — no loop, no bursts */
      paintStars(canvas.clientWidth, canvas.clientHeight, 0)
    } else {
      raf = window.requestAnimationFrame(frame)
    }

    const onResize = () => { fit(); if (reduce) paintStars(canvas.clientWidth, canvas.clientHeight, 0) }
    window.addEventListener('resize', onResize)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [fireworks])

  return <canvas ref={ref} className="night-sky" aria-hidden="true" />
}

/* ── Theme registry ───────────────────────────────────────────────────────────
   Six full design candidates in one app. Each maps to a real style studied on
   styles.refero.design, remixed with a classic-character color language.
   Purely visual: switching themes never touches room data, rankings, or sync. */

export type ThemeId = 'mickey' | 'minnie' | 'oswald' | 'sleek' | 'steamboat' | 'starlight' | 'donald'

export type Theme = {
  id: ThemeId
  name: string
  vibe: string
  source: string
  swatches: [string, string, string]
}

export const THEMES: Theme[] = [
  {
    id: 'mickey',
    name: 'Mickey · Firework Night',
    vibe: 'Storybook cream, true red, castle fireworks',
    source: 'Warm storybook on cream paper',
    swatches: ['#e3273d', '#ffc72c', '#191114'],
  },
  {
    id: 'minnie',
    name: 'Minnie · Polka Parlor',
    vibe: 'Rose pinks, white polka dots, ribbon bows',
    source: 'Soft playful gallery on linen',
    swatches: ['#e42a63', '#ffd3e2', '#33101f'],
  },
  {
    id: 'oswald',
    name: 'Oswald · Lucky Press',
    vibe: '1920s newsprint, halftone ink, trolley blue',
    source: 'Editorial journal on warm paper',
    swatches: ['#2f5f8f', '#f4ead8', '#1c1914'],
  },
  {
    id: 'sleek',
    name: 'Velvet Premiere',
    vibe: 'Black velvet cinema, whisper type, gold leaf',
    source: 'Cinema title card on black velvet',
    swatches: ['#0d0c10', '#cfa63f', '#f2efe7'],
  },
  {
    id: 'steamboat',
    name: 'Steamboat · 1928',
    vibe: 'Pure black and white, film grain, title cards',
    source: 'Cinematic monochrome gallery',
    swatches: ['#111111', '#ffffff', '#8a8a8a'],
  },
  {
    id: 'starlight',
    name: 'Starlight · Royal Midnight',
    vibe: 'Indigo constellations, aurora glass, star gold',
    source: 'Constellation floating on black',
    swatches: ['#241a58', '#7ab8ff', '#ffc72c'],
  },
  {
    id: 'donald',
    name: 'Donald · Sailor Day',
    vibe: 'Crisp navy and white, sailor stripes, sunny sky',
    source: 'Clean bright product page on white',
    swatches: ['#1f4fa3', '#ffffff', '#ffb31f'],
  },
]

export const THEME_STORAGE_KEY = 'pastor-jonathan-theme'

export function readStoredTheme(): ThemeId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return THEMES.some((theme) => theme.id === stored) ? (stored as ThemeId) : 'mickey'
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  localStorage.setItem(THEME_STORAGE_KEY, id)
}

/* ── Theme registry ───────────────────────────────────────────────────────────
   Six character design candidates in one app (Oswald carries a Color / B&W
   mode, absorbing the old Steamboat entry). Each maps to a real style studied
   on styles.refero.design, remixed with a character color language you can
   name on sight. Purely visual: switching never touches room data or sync. */

export type ThemeId = 'mickey' | 'minnie' | 'oswald' | 'oswald-bw' | 'buzz' | 'cheshire' | 'goofy'

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
    vibe: 'Bright shorts-red ground, glove white, castle fireworks',
    source: 'Warm storybook on cream paper',
    swatches: ['#ee2437', '#ffc72c', '#191114'],
  },
  {
    id: 'minnie',
    name: 'Minnie · Polka Parlor',
    vibe: 'Rose pinks, white polka dots, bow-tied ears',
    source: 'Soft playful gallery on linen',
    swatches: ['#e42a63', '#ffd3e2', '#33101f'],
  },
  {
    id: 'oswald',
    name: 'Oswald · Lucky Press',
    vibe: '1920s newsprint, blue-shorts cards, rabbit ears',
    source: 'Editorial journal on warm paper',
    swatches: ['#2f5f8f', '#f4ead8', '#1c1914'],
  },
  {
    id: 'oswald-bw',
    name: 'Oswald · Black & White',
    vibe: 'The same press with every drop of color drained',
    source: 'Cinematic monochrome gallery',
    swatches: ['#111111', '#ffffff', '#8a8a8a'],
  },
  {
    id: 'buzz',
    name: 'Infinity And Beyond',
    vibe: 'Space-ranger white, lime green, cosmic purple',
    source: 'Clean bright product page with a space hero',
    swatches: ['#6a3fc3', '#b6f542', '#f2f0fa'],
  },
  {
    id: 'cheshire',
    name: 'Cheshire · Moonlit Stripes',
    vibe: 'Pink and purple stripes you can name on sight',
    source: 'Constellation floating on black',
    swatches: ['#5b2a8c', '#e4569f', '#f9c8ff'],
  },
  {
    id: 'goofy',
    name: 'Goofy · Turtleneck Orange',
    vibe: 'Flat bright turtleneck orange, hat-green accents',
    source: 'Warm garden editorial on paper',
    swatches: ['#f6871e', '#2e7d4f', '#ffffff'],
  },
]

const ALL_IDS = THEMES.map((theme) => theme.id)

export const THEME_STORAGE_KEY = 'pastor-jonathan-theme'

export function readStoredTheme(): ThemeId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return ALL_IDS.includes(stored as ThemeId) ? (stored as ThemeId) : 'mickey'
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  localStorage.setItem(THEME_STORAGE_KEY, id)
}

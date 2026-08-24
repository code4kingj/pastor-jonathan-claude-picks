import { chromium } from 'playwright'

const url = process.argv[2]
if (!url) throw new Error('Pass the live invitation URL.')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
page.on('pageerror', (error) => errors.push(error.message))
await page.goto(url, { waitUntil: 'networkidle' })
const result = await page.evaluate(() => ({
  title: document.title,
  heading: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
  joinButton: [...document.querySelectorAll('button')].some((button) => button.textContent?.includes('Join the room')),
  localModeWarning: document.body.innerText.includes('Local preview mode'),
  bodyText: document.body.innerText.slice(0, 700),
  images: [...document.images].slice(0, 6).map((image) => ({ src: image.src, ok: image.complete && image.naturalWidth > 0 })),
}))
if (errors.length) throw new Error(errors.join('\n'))
if (result.title !== 'Pastor Jonathan’s Birthday Picks' || !result.joinButton || result.localModeWarning || result.images.some((image) => !image.ok)) {
  throw new Error(`Live verification failed: ${JSON.stringify(result)}`)
}
console.log(JSON.stringify({ url, ...result }, null, 2))
await browser.close()

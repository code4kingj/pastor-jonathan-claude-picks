import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const out = path.resolve('artifacts')
const baseUrl = process.env.QA_URL ?? 'http://127.0.0.1:5173/'
const roomApi = 'https://nlbohjwnqawjerakcjhn.supabase.co/functions/v1/family-room'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
let sharedUrl = ''

async function watchErrors(page) {
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`console: ${msg.text()}`))
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
}

try {
  const firstContext = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 })
  const page = await firstContext.newPage()
  await watchErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByLabel('What should the family call you?').fill('QA One')
  await page.getByRole('button', { name: 'Start our room' }).click()
  await page.getByRole('heading', { name: 'All 155 experiences' }).waitFor()
  sharedUrl = page.url()
  if (!sharedUrl.includes('#room=')) throw new Error('Shared invitation hash was not created.')
  if (await page.getByText('Local preview mode is active').count()) throw new Error('Production build is still in local mode.')

  const cards = page.locator('.attraction-card')
  if ((await cards.count()) !== 155) throw new Error(`Expected 155 attraction cards, found ${await cards.count()}`)
  await page.screenshot({ path: path.join(out, 'desktop-discover.png'), fullPage: false })
  const addButtons = page.getByRole('button', { name: 'Add to Top 33' })
  const firstSave = page.waitForResponse((response) => response.url() === roomApi && response.request().method() === 'PUT' && response.ok())
  for (let i = 0; i < 3; i += 1) {
    await addButtons.nth(0).click()
    await page.waitForFunction((expected) => Array.from(document.querySelectorAll('nav button')).some((button) => button.textContent?.includes('My Top 33') && button.textContent?.includes(String(expected))), i + 1)
  }
  await firstSave
  await page.getByRole('button', { name: /My Top 33/ }).click()
  await page.locator('.pick-row').nth(2).waitFor()
  if ((await page.locator('.pick-row').count()) !== 3) throw new Error('Three selected cards did not reach the ranking view.')
  const pickWatchLinks = page.locator('.pick-watch')
  if ((await pickWatchLinks.count()) !== 3) throw new Error('Every ranked pick must include a source-video link.')
  const firstPickHref = await pickWatchLinks.first().getAttribute('href')
  if (!firstPickHref?.includes('youtube.com/watch?v=Ok72hT9iOpY&t=')) throw new Error(`Invalid ranked-pick video link: ${firstPickHref}`)
  const reorderSave = page.waitForResponse((response) => response.url() === roomApi && response.request().method() === 'PUT' && response.ok())
  await page.getByRole('button', { name: /Move Horse-Drawn Streetcars down/ }).click()
  await reorderSave
  await page.screenshot({ path: path.join(out, 'desktop-ranking.png'), fullPage: false })

  const secondContext = await browser.newContext({ viewport: { width: 1100, height: 900 } })
  const second = await secondContext.newPage()
  await watchErrors(second)
  await second.goto(sharedUrl, { waitUntil: 'networkidle' })
  await second.getByLabel('What should the family call you?').fill('QA Two')
  await second.getByRole('button', { name: 'Join the room' }).click()
  await second.getByRole('heading', { name: 'All 155 experiences' }).waitFor()
  const secondAddButtons = second.getByRole('button', { name: 'Add to Top 33' })
  const secondSave = second.waitForResponse((response) => response.url() === roomApi && response.request().method() === 'PUT' && response.ok())
  await secondAddButtons.nth(1).click()
  await secondAddButtons.nth(1).click()
  await secondSave

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'All 155 experiences' }).waitFor()
  const topButton = page.getByRole('button', { name: /My Top 33/ })
  if (!(await topButton.innerText()).includes('3')) throw new Error('First member identity/ranking did not survive refresh.')
  await page.getByRole('button', { name: /Family Results/ }).click()
  await page.locator('.result-row').nth(2).waitFor()
  if (!(await page.locator('.results-hero').innerText()).includes('2 wishlists')) throw new Error('Second member did not merge into the family room.')
  await page.screenshot({ path: path.join(out, 'desktop-results.png'), fullPage: false })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: /Discover/ }).click()
  await page.screenshot({ path: path.join(out, 'mobile-discover.png'), fullPage: false })
  await page.getByRole('button', { name: /My Top 33/ }).click()
  await page.screenshot({ path: path.join(out, 'mobile-ranking.png'), fullPage: false })

  const renderedImages = await page.locator('img').evaluateAll((images) => images.slice(0, 12).map((img) => ({ src: img.getAttribute('src'), width: img.naturalWidth })))
  if (renderedImages.some((item) => !item.width)) throw new Error(`Broken images: ${JSON.stringify(renderedImages)}`)
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(JSON.stringify({ cards: 155, firstMemberPicks: 3, mergedMembers: 2, resultRows: 3, refreshPersistence: true, screenshots: 5, renderedImages }, null, 2))
  await secondContext.close()
  await firstContext.close()
} finally {
  if (sharedUrl) {
    const match = new URL(sharedUrl).hash.match(/^#room=([^.]+)\.([A-Za-z0-9_-]+)$/)
    if (match) {
      const response = await fetch(`${roomApi}?id=${match[1]}&key=${match[2]}`, { method: 'DELETE' })
      if (response.status !== 204) console.error(`QA cleanup returned ${response.status}`)
    }
  }
  await browser.close()
}

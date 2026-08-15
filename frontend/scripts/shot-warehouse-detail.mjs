/* Capture the warehouse detail page in representative states.
   Run: node scripts/shot-warehouse-detail.mjs
*/
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms = 900) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
})
await mkdir(OUT, { recursive: true })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

// land once so relative fetches resolve
await page.goto(`${BASE}/permits`, { waitUntil: 'networkidle0' })
await settle()

// 1 = central (many items); 2 = east (includes a low-stock item)
for (const id of [1, 2]) {
  await page.goto(`${BASE}/warehouses/${id}`, { waitUntil: 'networkidle0' })
  await settle()
  await page.screenshot({ path: `${OUT}/whd-${id}.png` })
  console.log('shot: warehouse', id)
}

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()

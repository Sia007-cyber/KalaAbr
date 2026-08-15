/* Verify the new logo: sidebar mark + favicon + tab title.
   Run: node scripts/shot-logo.mjs
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

await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0' })
await settle()
await page.screenshot({ path: `${OUT}/logo-sidebar.png`, clip: { x: 0, y: 0, width: 320, height: 220 } })
console.log('title:', await page.title())

// favicon: fetch the raw svg through the dev server
const fav = await page.evaluate(async () => {
  const r = await fetch('/favicon.svg')
  return await r.text()
})
console.log('favicon starts with cloud mark:', fav.includes('id="cloud"'))

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()

/* Verify the public landing + auth pages (RTL, logo, reveal motion).
   Run: node scripts/shot-auth.mjs
*/
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms = 600) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
})
await mkdir(OUT, { recursive: true })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

// ---------- Landing: hero ----------
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(900)
await page.screenshot({ path: `${OUT}/landing-hero.png` })
console.log('landing title:', await page.title())
const dir = await page.evaluate(() => getComputedStyle(document.body).direction)
console.log('document direction:', dir)

// ---------- Landing: scrolled (reveal features) ----------
await page.evaluate(() => window.scrollTo(0, 900))
await settle(1200)
await page.screenshot({ path: `${OUT}/landing-features.png` })
const revealed = await page.evaluate(() =>
  [...document.querySelectorAll('.reveal')].filter((el) =>
    el.classList.contains('is-in-view'),
  ).length,
)
console.log(`reveal cards in view: ${revealed}/4`)

// ---------- Login ----------
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' })
await settle(700)
await page.screenshot({ path: `${OUT}/login.png` })

// ---------- Register ----------
await page.goto(`${BASE}/register`, { waitUntil: 'networkidle0' })
await settle(700)
await page.screenshot({ path: `${OUT}/register.png` })

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()
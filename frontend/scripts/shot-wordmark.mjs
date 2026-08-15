/* Verify wordmark + landing nav changes visually.
   Run: node scripts/shot-wordmark.mjs
   Requires vite on :5173 (backend not needed for static views here). */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms = 700) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'],
})
await mkdir(OUT, { recursive: true })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

// ---------- Landing (unauth) ----------
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.removeItem('kalaabr.token'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(800)
console.log('landing path:', new URL(page.url()).pathname)
console.log('topbar nav links:', await page.evaluate(() =>
  [...document.querySelectorAll('.landing-nav a')].map(a => a.textContent.trim())))
console.log('wordmark present:', await page.evaluate(() => !!document.querySelector('.wordmark')))
console.log('wordmark aria-label:', await page.evaluate(() => document.querySelector('.wordmark')?.getAttribute('aria-label')))
await page.screenshot({ path: `${OUT}/wordmark-landing-topbar.png` })

// scroll to features hero-marks
await page.screenshot({ path: `${OUT}/wordmark-landing-hero.png` })

// ---------- Login / Register ----------
for (const r of ['/login', '/register']) {
  await page.goto(`${BASE}${r}`, { waitUntil: 'networkidle0' })
  await settle(600)
  await page.screenshot({ path: `${OUT}/wordmark-${r.slice(1)}.png` })
}

// ---------- Sidebar (dashboard) — needs a token; inject a dummy one so RequireAuth passes
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.setItem('kalaabr.token', 'dummy-for-screenshot'))
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0' })
await settle(900)
console.log('dashboard path:', new URL(page.url()).pathname)
await page.screenshot({ path: `${OUT}/wordmark-sidebar.png` })

console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')
await browser.close()
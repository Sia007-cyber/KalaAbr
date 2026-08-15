/* Verify the three wordmark + hero changes:
   1. combining fatha renders above the alef in «اَبـــر»
   2. «ابر» has a black stroke outline (no background chip)
   3. hero has animated crate/box decorations in the side gutters
   Run from frontend/: node scripts/shot-hero.mjs
   Requires vite on :5173. */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms = 900) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'],
})
await mkdir(OUT, { recursive: true })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.removeItem('kalaabr.token'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(1200) // let the staggered box animations finish

console.log('landing path:', new URL(page.url()).pathname)
console.log('box items present:', await page.evaluate(() =>
  document.querySelectorAll('.landing-hero-decor .landing-decor-item').length))
console.log(
  'box items visible (opacity):',
  await page.evaluate(() =>
    [...document.querySelectorAll('.landing-decor-item')].map(
      (el) => getComputedStyle(el).opacity,
    )),
)
// wordmark internals — fatha char present next to the alef?
console.log('abr glyphs:', await page.evaluate(() => {
  const abr = document.querySelector('.wordmark-abr')
  return abr ? abr.textContent : null
}))
console.log(
  'abr stroke:',
  await page.evaluate(() => {
    const el = document.querySelector('.wordmark-abr')
    return el ? getComputedStyle(el).webkitTextStroke || getComputedStyle(el)['-webkit-text-stroke'] || '' : ''
  }))

await page.screenshot({ path: `${OUT}/hero-decor-wide.png` })
// close-up of the topbar wordmark
await page.screenshot({
  path: `${OUT}/wordmark-topbar-closeup.png`,
  clip: {
    x: 0, y: 0,
    width: 520, height: 96,
  },
})

// reduced-motion probe: force the media query and confirm the layer stays visible
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.reload({ waitUntil: 'networkidle0' })
await settle(300)
console.log(
  'reduced-motion: opacity of item 1 =',
  await page.evaluate(() => getComputedStyle(document.querySelector('.landing-decor-item')).opacity),
  '(expected 1 — visible without animation)',
)

console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')
await browser.close()
/* Screenshot the permit form incl. a real interaction:
   pick warehouse → item → qty/price → preview. Run: node scripts/shot-permit-form.mjs */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'

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

const settle = () => new Promise((r) => setTimeout(r, 700))

// --- purchase flow via ?type=purchase from the permits page primary action ---
await page.goto(`${BASE}/permits/new?type=purchase`, { waitUntil: 'networkidle0' })
await settle()
await page.screenshot({ path: `${OUT}/permit-form-editor.png` })
console.log('captured editor')

// select warehouse (first option that's not the placeholder)
const whVal = await page.evaluate(() => {
  const sel = document.querySelector('#pf-wh')
  return sel.options.length > 1 ? sel.options[1].value : null
})
console.log('warehouse option:', whVal)

// interact: choose warehouse, pick an item, fill qty + price
await page.select('#pf-wh', whVal)
await settle()

// first item select in the first line row
const itVal = await page.evaluate(() => {
  const lines = document.querySelectorAll('.line-editor .line-select')
  return lines.length && lines[0].options.length > 1 ? lines[0].options[1].value : null
})
console.log('item option:', itVal)
if (itVal) {
  await page.evaluate((v) => {
    document.querySelectorAll('.line-editor .line-select')[0].value = v
    document.querySelectorAll('.line-editor .line-select')[0].dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelectorAll('.line-editor .line-select')[0].dispatchEvent(new Event('change', { bubbles: true }))
  }, itVal)
  await settle()
}

// fill qty + price inputs
const inputs = await page.$$('.line-editor .line-qty')
if (inputs.length >= 2) {
  await inputs[0].click({ clickCount: 3 })
  await inputs[0].type('25')
  await inputs[1].click({ clickCount: 3 })
  await inputs[1].type('120000')
  await settle()
}
await page.screenshot({ path: `${OUT}/permit-form-filled.png` })
console.log('captured filled')

// advance to preview
const prev = await page.$$('button')
for (const b of prev) {
  const t = await b.evaluate((el) => el.textContent)
  if (t && t.includes('پیشنمایش')) { await b.click(); break }
}
await settle()
await page.screenshot({ path: `${OUT}/permit-form-preview.png` })
console.log('captured preview')

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()
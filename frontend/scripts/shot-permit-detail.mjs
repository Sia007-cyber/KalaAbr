/* Drive the permit detail page through every lifecycle state:
   ISSUED sale → confirm dialog → CONFIRMED
   ISSUED purchase → confirm dialog → CONFIRMED
   ISSUED purchase → cancel dialog → CANCELLED
   plus read-only CANCELLED. Captures each screen + ledger deltas.
   Run: node scripts/shot-permit-detail.mjs
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
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

const clickButton = async (text, scopeSel) => {
  const btns = await page.$$(scopeSel ? `${scopeSel} button` : 'button')
  for (const b of btns) {
    const t = await b.evaluate((el) => el.textContent.trim())
    if (t === text || t.includes(text)) { await b.click(); return true }
  }
  return false
}

const cash = () => page.evaluate(async () => {
  const r = await fetch('/api/cash-account')
  return (await r.json()).balance
})

// land on the app first so relative fetches resolve
await page.goto(`${BASE}/permits`, { waitUntil: 'networkidle0' })
await settle()

const before = await cash()
console.log('cash before:', before)

// --- 1. SALE ISSUED → confirm dialog → CONFIRMED ---
await page.goto(`${BASE}/permits/1`, { waitUntil: 'networkidle0' })
await settle()
await page.screenshot({ path: `${OUT}/pd-sale-issued.png` })
console.log('shot: sale ISSUED')
await clickButton('پرداخت و تأیید')
await settle(500)
await page.screenshot({ path: `${OUT}/pd-sale-confirm-dialog.png` })
console.log('shot: sale confirm dialog')
await clickButton('تأیید نهایی', '.dlg-content')
await settle(1600)
await page.screenshot({ path: `${OUT}/pd-sale-confirmed.png` })
console.log('shot: sale CONFIRMED (after)', await cash())

// --- 2. PURCHASE ISSUED → confirm dialog → CONFIRMED ---
await page.goto(`${BASE}/permits/4`, { waitUntil: 'networkidle0' })
await settle()
await page.screenshot({ path: `${OUT}/pd-purchase-issued.png` })
console.log('shot: purchase ISSUED')
await clickButton('تأیید مجوز خرید')
await settle(500)
await page.screenshot({ path: `${OUT}/pd-purchase-confirm-dialog.png` })
console.log('shot: purchase confirm dialog')
await clickButton('تأیید نهایی', '.dlg-content')
await settle(1600)
await page.screenshot({ path: `${OUT}/pd-purchase-confirmed.png` })
console.log('shot: purchase CONFIRMED (after)', await cash())

// --- 3. PURCHASE ISSUED → cancel dialog → CANCELLED ---
await page.goto(`${BASE}/permits/5`, { waitUntil: 'networkidle0' })
await settle()
await clickButton('لغو مجوز')
await settle(500)
await page.screenshot({ path: `${OUT}/pd-purchase-cancel-dialog.png` })
console.log('shot: purchase cancel dialog')
await clickButton('لغو مجوز', '.dlg-content')
await settle(1600)
await page.screenshot({ path: `${OUT}/pd-purchase-cancelled.png` })
console.log('shot: purchase CANCELLED (after)', await cash())

// --- 4. CANCELLED read-only ---
await page.goto(`${BASE}/permits/6`, { waitUntil: 'networkidle0' })
await settle()
await page.screenshot({ path: `${OUT}/pd-cancelled-readonly.png` })
console.log('shot: cancelled read-only')

console.log('cash after:', await cash())
console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()
/* End-to-end: drive the permit form through a real purchase issue,
   then cancel the permit to restore the ledger (cancel refunds cash).
   Verifies form → TanStack mutation → backend → redirect → detail.
   Run: node scripts/e2e-permit.mjs
*/
import puppeteer from 'puppeteer-core'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const settle = () => new Promise((r) => setTimeout(r, 700))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

await page.goto(`${BASE}/permits/new?type=purchase`, { waitUntil: 'networkidle0' })
await settle()

// cash balance BEFORE
const before = await page.evaluate(async () => {
  const r = await fetch('/api/cash-account')
  return (await r.json()).balance
})
console.log('cash before:', before)

// pick warehouse (option 1 = first real one)
const whVal = await page.evaluate(() => {
  const sel = document.querySelector('#pf-wh')
  return sel.options.length > 1 ? sel.options[1].value : null
})
await page.select('#pf-wh', whVal)
await settle()

// pick first item, qty 1, price 75,000
await page.evaluate(() => {
  const sels = document.querySelectorAll('.line-editor .line-select')
  if (sels.length && sels[0].options.length > 1) {
    sels[0].value = sels[0].options[1].value
    sels[0].dispatchEvent(new Event('input', { bubbles: true }))
    sels[0].dispatchEvent(new Event('change', { bubbles: true }))
  }
})
await settle()
const inputs = await page.$$('.line-editor .line-qty')
await inputs[0].click({ clickCount: 3 }); await inputs[0].type('1')
await inputs[1].click({ clickCount: 3 }); await inputs[1].type('75000')
await settle()

// preview
const btns = await page.$$('button')
for (const b of btns) {
  const t = await b.evaluate((el) => el.textContent)
  if (t && t.includes('پیشنمایش')) { await b.click(); break }
}
await settle()

// commit
const btns2 = await page.$$('button')
for (const b of btns2) {
  const t = await b.evaluate((el) => el.textContent)
  if (t && t.includes('صدور نهایی')) { await b.click(); break }
}

// wait for navigation to permit detail page
let finalUrl = page.url()
for (let i = 0; i < 20 && !/\/permits\/\d+$/.test(finalUrl); i++) {
  await settle()
  finalUrl = page.url()
}
console.log('final url:', finalUrl)
const m = finalUrl.match(/\/permits\/(\d+)$/)
if (!m) {
  console.log('FAIL: did not navigate to a permit detail page')
  console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
  await browser.close()
  process.exit(1)
}
const permitId = m[1]
console.log('issued permit id:', permitId)

// cash after issue
const after = await page.evaluate(async () => {
  const r = await fetch('/api/cash-account')
  return (await r.json()).balance
})
console.log('cash after issue:', after)

// cancel to restore ledger (also verifies cancel mutation + cash refund)
const cancelRes = await page.evaluate(async (id) => {
  const r = await fetch(`/api/permits/${id}/cancel`, { method: 'POST' })
  return { status: r.status, body: await r.json() }
}, permitId)
console.log('cancel status:', cancelRes.status, '→', cancelRes.body.status)

const restored = await page.evaluate(async () => {
  const r = await fetch('/api/cash-account')
  return (await r.json()).balance
})
console.log('cash after cancel:', restored)
console.log('ledger restored:', restored === before ? 'YES' : `NO (${before} vs ${restored})`)

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()
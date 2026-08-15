/* Screenshot helper — boots system Chrome via puppeteer-core, visits
   the dev server, captures screenshots of key routes to /tmp/shots.
   Run: node scripts/screenshot.mjs
*/
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'

const routes = [
  ['dashboard', '/dashboard'],
  ['inventory', '/inventory'],
  ['permits', '/permits'],
  ['items', '/items'],
  ['warehouses', '/warehouses'],
  ['cash', '/cash'],
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
})

await mkdir(OUT, { recursive: true })

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

// capture console errors
const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

for (const [name, path] of routes) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 700)) // let skeletons settle
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`captured ${name}`)
}

// open the command palette on dashboard
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0' })
await page.keyboard.down('Control')
await page.keyboard.press('KeyK')
await page.keyboard.up('Control')
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: `${OUT}/palette.png` })
console.log('captured palette')

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none')
await browser.close()
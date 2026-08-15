/* High-DPR close-ups of the wordmark (fatha + stroke) and hero. */
import puppeteer from 'puppeteer-core'
const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 3 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.removeItem('kalaabr.token'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await new Promise(r => setTimeout(r, 1400))
await page.screenshot({ path: `${OUT}/wordmark-zoomed.png`, clip: { x: 0, y: 0, width: 560, height: 130 } })
await page.screenshot({ path: `${OUT}/hero-zoom.png` })
await browser.close()

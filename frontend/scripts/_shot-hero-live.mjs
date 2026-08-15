import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms) => new Promise(r => setTimeout(r, ms))
await mkdir(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.removeItem('kalaabr.token'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(1400)
await page.screenshot({ path: `${OUT}/hero-live-wide.png` })
// topbar wordmark closeup
await page.screenshot({ path: `${OUT}/wordmark-live-top.png`, clip: { x: 0, y: 0, width: 560, height: 110 } })
// hero wordmark closeup (top-right in RTL / mark area)
await page.evaluate(() => document.querySelector('.landing-hero-mark')?.scrollIntoView())
await settle(200)
await page.screenshot({ path: `${OUT}/hero-live-area.png` })
console.log('wordmark texts:', await page.evaluate(() => {
  const w = document.querySelector('.wordmark')
  const abr = document.querySelector('.wordmark-abr')
  return { aria: w?.getAttribute('aria-label'), abrText: abr?.textContent }
}))
await browser.close()

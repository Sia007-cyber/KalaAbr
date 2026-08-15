import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms) => new Promise(r => setTimeout(r, ms))
await mkdir(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.removeItem('kalaabr.token'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(1500)

// 1) full hero at dpr 2
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 })
await page.screenshot({ path: `${OUT}/hero-full-dpr2.png` })

// 2) huge fatha render on-screen
await page.evaluate(() => {
  const el = document.createElement('div')
  el.id = 'fathabig'
  el.lang = 'fa'; el.dir = 'rtl'
  el.style.cssText = 'position:fixed;left:0;top:0;background:#fff;padding:48px;font-size:120px;line-height:1.4;font-weight:700;font-family:"Vazirmatn Variable","Vazirmatn",sans-serif;-webkit-text-stroke:1px #000;color:#fff;z-index:99999'
  el.innerHTML = '<div><b>with fatha:</b> <span>اَبر</span></div><div><b>no fatha:</b> <span style="-webkit-text-stroke:0;color:#000">ابر</span></div>'
  document.body.appendChild(el)
})
await settle(400)
const box = await page.evaluate(() => {
  const el = document.getElementById('fathabig')
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
await page.screenshot({ path: `${OUT}/fatha-onscreen.png`, clip: { x: box.x, y: box.y, width: box.w, height: box.h } })
await page.evaluate(() => document.getElementById('fathabig').remove())
await settle(200)

// 3) hero area with wordmark mark at dpr 3
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 3 })
const heroBox = await page.evaluate(() => {
  const el = document.querySelector('.landing-hero')
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
await page.screenshot({ path: `${OUT}/hero-section.png`, clip: { x: heroBox.x, y: heroBox.y, width: heroBox.w, height: heroBox.h } })
console.log('hero box:', JSON.stringify(heroBox))
await browser.close()

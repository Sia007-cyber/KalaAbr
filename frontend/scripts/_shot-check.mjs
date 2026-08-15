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

// 1) Clone the REAL .wordmark component and render it huge so we can inspect actual component styling
await page.evaluate(() => {
  const orig = document.querySelector('.wordmark')
  const clone = orig.cloneNode(true)
  clone.id = 'wmbig'
  clone.style.cssText = 'position:fixed;left:24px;top:24px;z-index:99999;font-size:120px;line-height:1.3;background:#fff;padding:20px;'
  document.body.appendChild(clone)
})
const wmBox = await page.evaluate(() => {
  const el = document.getElementById('wmbig')
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
await page.screenshot({ path: `${OUT}/wordmark-component-big.png`, clip: { x: wmBox.x, y: wmBox.y, width: wmBox.w, height: wmBox.h } })
await page.evaluate(() => document.getElementById('wmbig').remove())

// 2) Zoom into hero left + right gutters to confirm crates
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 3 })
const heroBox = await page.evaluate(() => {
  const el = document.querySelector('.landing-hero')
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
// left gutter (inline-start, which is RIGHT side in RTL? inset-inline-start follows dir rtl => right side)
// We placed items via inset-inline-start / inset-inline-end; with dir rtl inline-start = right.
// Capture both sides: leftmost 260px and rightmost 260px of hero, full height-ish
await page.screenshot({
  path: `${OUT}/hero-left-gutter.png`,
  clip: { x: heroBox.x, y: heroBox.y, width: 280, height: heroBox.h },
})
await page.screenshot({
  path: `${OUT}/hero-right-gutter.png`,
  clip: { x: heroBox.x + heroBox.w - 280, y: heroBox.y, width: 280, height: heroBox.h },
})

// log computed styles to prove no background chip + outline present
console.log('abr styles:', await page.evaluate(() => {
  const el = document.querySelector('.wordmark-abr')
  const cs = getComputedStyle(el)
  return {
    color: cs.color,
    bg: cs.backgroundColor,
    stroke: cs.webkitTextStroke || cs['-webkit-text-stroke'] || '',
    strokeWidth: cs.webkitTextStrokeWidth || cs['-webkit-text-stroke-width'] || '',
  }
}))
console.log('kala styles:', await page.evaluate(() => {
  const el = document.querySelector('.wordmark-kala')
  const cs = getComputedStyle(el)
  return { color: cs.color, bg: cs.backgroundColor, stroke: cs.webkitTextStroke || cs['-webkit-text-stroke'] || '' }
}))
console.log('decor items:', await page.evaluate(() => document.querySelectorAll('.landing-decor-item').length))
console.log('decor positions:', await page.evaluate(() => {
  return [...document.querySelectorAll('.landing-decor-item')].map((el, i) => {
    const r = el.getBoundingClientRect()
    return `#${i+1} x=${Math.round(r.left)} y=${Math.round(r.top)} w=${Math.round(r.width)}`
  })
}))
await browser.close()

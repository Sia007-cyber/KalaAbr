/* Capture the full landing page hero (persistent gray header + both
   dense side box columns) in headless Chrome. Run from frontend/ so
   puppeteer-core resolves. */
import puppeteer from 'puppeteer-core'

const CHROME = '/usr/bin/google-chrome-stable'
const URL = process.env.URL || 'http://localhost:5173/'
const OUT = process.env.OUT || '/tmp/shots/landing-hero.png'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })
/* Let the staggered box-rise + any scroll reveal settle. */
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: OUT, fullPage: true })
console.log('captured', OUT)
await browser.close()

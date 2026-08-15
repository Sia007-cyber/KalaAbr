/* Render the generated box spec page in headless Chrome and capture it. */
import puppeteer from 'puppeteer-core'

const CHROME = '/usr/bin/google-chrome-stable'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 })
await page.goto('file:///tmp/box-spec.html', { waitUntil: 'load' })
await page.screenshot({ path: '/tmp/shots/box-spec.png', fullPage: true })
console.log('captured /tmp/shots/box-spec.png')
await browser.close()
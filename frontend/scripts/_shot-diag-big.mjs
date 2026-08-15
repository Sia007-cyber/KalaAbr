/* Screenshot the diagnostic box page at large scale. */
import puppeteer from 'puppeteer-core'

const CHROME = '/usr/bin/google-chrome-stable'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1400, deviceScaleFactor: 2 })
await page.goto('file:///tmp/box-diag-big.html', { waitUntil: 'load' })
await page.screenshot({ path: '/tmp/shots/box-diag-big.png', fullPage: true })
console.log('captured /tmp/shots/box-diag-big.png')
await browser.close()
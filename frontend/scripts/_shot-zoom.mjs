import puppeteer from 'puppeteer-core'
const CHROME = '/usr/bin/google-chrome-stable'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1400, deviceScaleFactor: 2 })
await page.goto('file:///tmp/box-zoom.html', { waitUntil: 'load' })
await page.screenshot({ path: '/tmp/shots/box-zoom.png', fullPage: true })
console.log('captured /tmp/shots/box-zoom.png')
await browser.close()

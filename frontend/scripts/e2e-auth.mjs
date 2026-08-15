/* Live end-to-end: register → redirect to login → login → dashboard,
   plus route protection. Requires backend on :8080 + vite on :5173.
   Run: node scripts/e2e-auth.mjs  (args: username) */
import puppeteer from 'puppeteer-core'

const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const settle = (ms = 700) => new Promise((r) => setTimeout(r, ms))
const user = process.argv[2] || ('e2e_' + Date.now())

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
const path = () => new URL(page.url()).pathname

/* 1. unauthenticated /dashboard → should redirect to /login */
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0' })
console.log('unauth /dashboard → path =', path())
await settle(600)

/* 2. register */
await page.goto(`${BASE}/register`, { waitUntil: 'networkidle0' })
await page.type('#username', user)
await page.type('#email', `${user}@kalaabr.test`)
await page.type('#password', 'password123')
await settle(200)
await page.click('button[type="submit"]')
await settle(1500)
console.log('after register → path =', path(), '| heading =',
  await page.evaluate(() => document.querySelector('.auth-title')?.textContent))
await page.screenshot({ path: '/tmp/shots/e2e-register-success.png' })

/* 3. navigate to login, fill, submit */
await page.click('a[href="/login"]')
await settle(800)
await page.type('#identifier', user)
await page.type('#password', 'password123')
await settle(200)
await page.click('button[type="submit"]')
await settle(2000)
console.log('after login → path =', path())
await page.screenshot({ path: '/tmp/shots/e2e-dashboard.png' })

/* 4. authenticated / → should redirect to /dashboard */
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(900)
console.log('authenticated / → path =', path())

/* 5. keep token on reload (localStorage) */
await page.reload({ waitUntil: 'networkidle0' })
await settle(900)
console.log('after reload / → path =', path())

console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')
await browser.close()

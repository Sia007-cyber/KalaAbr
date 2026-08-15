import puppeteer from 'puppeteer-core'
const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
const settle = (ms) => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.removeItem('kalaabr.token'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(1200)

// 1) Measure actual ink of "ابر" vs "اَبر" via canvas — is there ink above the alef for the fatha version?
const canvasProbe = await page.evaluate(() => {
  const font = '"Vazirmatn Variable", "Vazirmatn", sans-serif'
  const mk = (txt) => {
    const c = document.createElement('canvas')
    c.width = 300; c.height = 300
    const g = c.getContext('2d')
    g.font = `700 96px ${font}`
    g.textBaseline = 'top'
    g.fillStyle = '#000'
    g.fillText(txt, 10, 40)
    const d = g.getImageData(0, 0, 300, 300).data
    // find bounding box of dark pixels
    let minX=1e9, minY=1e9, maxX=-1, maxY=-1
    for (let y=0;y<300;y++) for (let x=0;x<300;x++) {
      const i = (y*300+x)*4
      if (d[i+3] > 40 && d[i] < 128 && d[i+1] < 128 && d[i+2] < 128) {
        if (x<minX)minX=x; if (x>maxX)maxX=x; if (y<minY)minY=y; if (y>maxY)maxY=y
      }
    }
    return { minX, minY, maxX, maxY, w: maxX-minX+1, h: maxY-minY+1 }
  }
  return { withFatha: mk('اَبر'), noFatha: mk('ابر') }
})
console.log('canvas ink:', JSON.stringify(canvasProbe))

// 2) Big DOM render for visual inspection
await page.evaluate(() => {
  const el = document.createElement('div')
  el.id = 'fathabig'
  el.lang = 'fa'; el.dir = 'rtl'
  el.style.cssText = 'position:fixed;left:-10000px;top:0;background:#fff;padding:40px;font-size:110px;font-weight:700;font-family:"Vazirmatn Variable","Vazirmatn",sans-serif;-webkit-text-stroke:1px #000;color:#fff;z-index:9999'
  el.innerHTML = '<span>کالاابر</span> <span>اَبر</span> <span id="nof">ابر</span>'
  document.body.appendChild(el)
})
const box = await page.evaluate(() => {
  const el = document.getElementById('fathabig')
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
// move into view
await page.evaluate(() => {
  const el = document.getElementById('fathabig')
  el.style.left = '0px'
})
await settle(300)
const bigBox = await page.evaluate(() => {
  const el = document.getElementById('fathabig')
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
})
await page.screenshot({ path: `${OUT}/fatha-big.png`, clip: { x: bigBox.x, y: bigBox.y, width: bigBox.w, height: bigBox.h } })

console.log('fatha-big box:', JSON.stringify(bigBox))
await browser.close()

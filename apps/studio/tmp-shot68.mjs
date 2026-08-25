import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1700, height: 950 } })
await p.goto('http://localhost:4316/studio', { waitUntil: 'networkidle', timeout: 90000 })
await p.waitForTimeout(1500)
await p.screenshot({ path: '/tmp/studio-inicio.png' })
console.log(JSON.stringify((await p.locator('[data-testid]').evaluateAll(els => els.map(e => e.getAttribute('data-testid')))).slice(0, 40)))
await b.close()

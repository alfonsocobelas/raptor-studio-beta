// Spec 68: ¿lleva el lienzo la piel de verdad? Se monta una vista con tabla y KPIs, se recorren
// las tres pieles y se mide el radio de lo que se ve — más el chrome del ESTUDIO, que no debe
// teñirse. Ojo: esto escribe en .studio/designs (autosave); respaldar antes.
import { chromium } from 'playwright'
const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1700, height: 950 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
await page.goto(`${WEB}/studio`, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(1200)

await page.getByTestId('tool-new-view').click()
await page.getByTestId('preset-list').click()
await page.getByTestId('new-page-title').fill('Contratos')
await page.getByTestId('new-page-ok').click()
await page.waitForSelector('[data-testid="table-create"]')
await page.getByTestId('block-tool-kpis').click()
await page.waitForTimeout(800)

const measure = () =>
  page.evaluate(() => {
    const r = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).borderRadius : '—' }
    const scope = document.querySelector('[data-testid="preview-scope"]')
    return {
      piel: scope?.getAttribute('data-preset') ?? '—',
      kpi: r('[data-testid="preview-scope"] [hlmcard]'),
      tabla: r('[data-testid="preview-scope"] table'),
      envoltura: r('[data-testid="preview-scope"] .rounded-lg'),
      badge: r('[data-testid="preview-scope"] .rounded-full'),
      hoja: (document.querySelector('[data-testid="preset-canvas-css"]')?.textContent ?? '').length,
      chromeEstudio: r('[data-testid="tool-new-view"]')
    }
  })

const rows = []
for (const preset of ['actual', 'cabina', 'suite']) {
  await page.getByTestId('panel-tab-skin').click()
  await page.getByTestId(`preview-preset-${preset}`).click()
  await page.waitForTimeout(900)
  rows.push(await measure())
  await page.screenshot({ path: `/tmp/studio-68-${preset}.png` })
}
console.log(JSON.stringify({ rows, errors }, null, 1))
await browser.close()

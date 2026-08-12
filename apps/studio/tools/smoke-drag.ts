/**
 * Smoke del arrastre de componentes al lienzo (modo Vistas). Los specs de vitest no
 * pueden montar `studio-canvas-page` —su `input()` de señal necesita el compilador
 * AOT—, así que el gesto real se verifica aquí: arrastrar desde la paleta, ver los
 * huecos aparecer y soltar en uno concreto.
 *
 *   npx tsx tools/smoke-drag.ts   (con `npm run web` corriendo)
 */
import { chromium, type Page } from 'playwright'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'

/** Playwright no simula HTML5 drag & drop con dragTo: hay que enviar los eventos. */
async function dragBlockOnto(page: Page, tool: string, zone: string, shot?: string): Promise<void> {
  await page.getByTestId(tool).dispatchEvent('dragstart')
  await page.waitForSelector(`[data-testid="${zone}"]`)
  await page.getByTestId(zone).dispatchEvent('dragover')
  if (shot) await page.screenshot({ path: shot })
  await page.getByTestId(zone).dispatchEvent('drop')
}

/** Los bloques dibujados, en orden: los botones de hover (`block-up-0`) no cuentan. */
async function blocks(page: Page): Promise<string[]> {
  const ids = await page
    .locator('[data-testid="preview-scope"] [data-testid^="block-"]')
    .evaluateAll(nodes => nodes.map(node => node.getAttribute('data-testid') ?? ''))
  return ids.filter(id => /^block-(table|kpis|cards|fields|attachments|text)-\d+$/.test(id)).map(id => id.split('-')[1])
}

/**
 * Los bloques cuando el lienzo se ha repintado: el store cambia en el mismo tick del
 * clic, pero el DOM llega un tick después, y sin esperar la lectura pilla la vista vieja.
 */
async function blocksWhenPainted(page: Page, expected: string): Promise<string[]> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const painted = await blocks(page)
    if (painted.join() === expected) return painted
    await page.waitForTimeout(100)
  }
  return blocks(page)
}

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1700, height: 950 } })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(`${WEB}/studio`, { waitUntil: 'networkidle', timeout: 90000 })

  const failures: string[] = []
  const check = async (description: string, assertion: () => Promise<boolean>): Promise<void> => {
    const ok = await assertion()
    console.log(`${ok ? '✅' : '❌'} ${description}`)
    if (!ok) failures.push(description)
  }

  // una vista con tabla: ya trae entidad, así que el arrastre no tiene nada que preguntar
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pacientes')
  await page.getByTestId('new-page-ok').click()

  await check(
    'en reposo el lienzo no enseña huecos',
    async () => (await page.locator('[data-testid^="drop-zone-"]').count()) === 0
  )

  await check('ya no hay selector de entidad al pulsar un componente', async () => {
    await page.getByTestId('block-tool-kpis').click()
    return (await page.locator('[data-testid^="add-kpis-"]').count()) === 0
  })

  await check(
    'el clic deja el bloque al final, con la entidad de la vista',
    async () => (await blocksWhenPainted(page, 'table,kpis')).join() === 'table,kpis'
  )

  await dragBlockOnto(page, 'block-tool-cards', 'drop-zone-0', 'e2e-35-drag-huecos.png')
  await check(
    'soltado en el primer hueco, el bloque cae el primero',
    async () => (await blocksWhenPainted(page, 'cards,table,kpis')).join() === 'cards,table,kpis'
  )

  await check('soltar apaga los huecos', async () => (await page.locator('[data-testid^="drop-zone-"]').count()) === 0)

  await page.screenshot({ path: 'e2e-35-drag-drop.png' })

  // una vista en blanco: el hueco es la propia vista vacía
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-blank').click()
  await page.getByTestId('new-page-title').fill('Portada')
  await page.getByTestId('new-page-ok').click()

  await dragBlockOnto(page, 'block-tool-table', 'drop-zone-0', 'e2e-36-drag-vista-vacia.png')
  await check(
    'la vista vacía admite el primer bloque',
    async () => (await blocksWhenPainted(page, 'table')).join() === 'table'
  )

  if (errors.length) console.log('errores de página:', errors)
  await browser.close()
  if (failures.length || errors.length) process.exit(1)
}

void main()

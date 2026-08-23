/**
 * Smoke del bloque Calendario (spec 59, mock 22E). Los specs de vitest cubren store y
 * componentes por separado; el gesto real va aquí: soltar «Calendario», ver el badge
 * «aún no generable» sin campo fecha, crear el campo, elegirlo en el panel y ver el
 * mini-mes con su pie y su leyenda.
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-calendar.ts
 *   (con `npm run web` corriendo)
 */
import { chromium } from 'playwright'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1700, height: 950 } })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(`${WEB}/studio`, { waitUntil: 'networkidle', timeout: 90000 })

  const failures: string[] = []
  const check = async (description: string, assertion: () => Promise<boolean>): Promise<void> => {
    const ok = await assertion().catch(() => false)
    console.log(`${ok ? '✅' : '❌'} ${description}`)
    if (!ok) failures.push(description)
  }

  const chooseInSelect = async (testId: string, optionLabel: string): Promise<void> => {
    await page.locator(`[data-testid="${testId}"] button`).click()
    await page.locator('hlm-select-item', { hasText: optionLabel }).first().click()
  }

  await check('la paleta ofrece el bloque Calendario', async () => {
    await page.waitForSelector('[data-testid="block-tool-calendar"]')
    return (await page.getByTestId('block-tool-calendar').textContent())?.includes('Calendario') ?? false
  })

  // una vista con tabla: «Pedidos» → entidad pedido (solo campo nombre, sin fecha)
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pedidos')
  await page.getByTestId('new-page-ok').click()
  await page.waitForSelector('[data-testid="table-create"]')

  await page.getByTestId('block-tool-calendar').click()
  await check('sin campo fecha el bloque se marca «aún no generable»', async () => {
    await page.waitForSelector('[data-testid^="block-calendar-"]')
    return (await page.getByText('diseño · aún no generable').count()) > 0
  })

  // seleccionar la entidad (clic en el bloque) y abrir Componente para añadir el campo fecha
  await page.locator('[data-testid^="block-calendar-"]').click()
  await page.getByTestId('panel-tab-component').click()
  await page.waitForSelector('[data-testid="field-add"]')
  await page.getByTestId('field-add').click()
  const labelInputs = page.locator('[data-testid^="field-label-"]')
  const lastLabel = labelInputs.last()
  await lastLabel.fill('Entrega')
  await lastLabel.press('Enter')
  const lastIndex = (await labelInputs.count()) - 1
  await chooseInSelect(`field-type-${lastIndex}`, 'fecha')

  await check('el panel del bloque ofrece la configuración del calendario', async () => {
    await page.waitForSelector('[data-testid="calendar-config"]')
    return true
  })

  await chooseInSelect('calendar-date', 'Entrega')
  await check('con fecha elegida el badge desaparece y el mini-mes se pinta', async () => {
    await page.waitForSelector('studio-canvas-calendar')
    const badge = await page.getByText('diseño · aún no generable').count()
    const text = (await page.locator('studio-canvas-calendar').textContent()) ?? ''
    return badge === 0 && text.includes('LUN') && text.includes('campo fecha Entrega')
  })

  const weekendToggle = page.getByTestId('calendar-weekends')
  await weekendToggle.click()
  await check('apagar el fin de semana recorta la rejilla a cinco días', async () => {
    const text = (await page.locator('studio-canvas-calendar').textContent()) ?? ''
    return text.includes('VIE') && !text.includes('SÁB')
  })

  await page.screenshot({ path: 'e2e-59-calendario.png' })

  if (errors.length) console.log('errores de página:', errors)
  await browser.close()
  if (failures.length || errors.length) process.exit(1)
}

void main()

/**
 * Smoke del bloque Kanban (spec 61, 22F). El gesto real: soltar «Kanban», ver el
 * badge sin campo enum, crear el enum, elegirlo en el panel y ver el tablero.
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-kanban.ts
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
    // el panel se re-renderiza al mutar el draft: si el primer click abre y un render
    // cierra el overlay, se reintenta la apertura antes de rendirse
    const item = page.locator('hlm-select-item', { hasText: optionLabel }).first()
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.locator(`[data-testid="${testId}"] button`).click()
      try {
        await item.click({ timeout: 3000 })
        return
      } catch {
        await page.waitForTimeout(300)
      }
    }
    const offered = await page.locator('hlm-select-item').allTextContents()
    throw new Error(`no se pudo elegir «${optionLabel}» en ${testId}; ofrecidas: ${JSON.stringify(offered)}`)
  }

  await check('la paleta ofrece el bloque Kanban', async () => {
    await page.waitForSelector('[data-testid="block-tool-kanban"]')
    return (await page.getByTestId('block-tool-kanban').textContent())?.includes('Kanban') ?? false
  })

  // una vista con tabla: «Pedidos» → entidad pedido (solo campo nombre, sin enum)
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pedidos')
  await page.getByTestId('new-page-ok').click()
  await page.waitForSelector('[data-testid="table-create"]')

  await page.getByTestId('block-tool-kanban').click()
  await check('sin campo enum el bloque se marca «aún no generable»', async () => {
    await page.waitForSelector('[data-testid^="block-kanban-"]')
    return (await page.getByText('diseño · aún no generable').count()) > 0
  })

  // seleccionar la entidad y añadir un enum desde el inspector
  await page.locator('[data-testid^="block-kanban-"]').click()
  await page.getByTestId('panel-tab-component').click()
  await page.waitForSelector('[data-testid="field-add"]')
  await page.getByTestId('field-add').click()
  // .last() se resuelve con UNA sola fila si la nueva aún no pintó: esperar la segunda
  await page.waitForSelector('[data-testid="field-label-1"]')
  const labelInputs = page.locator('[data-testid^="field-label-"]')
  const lastLabel = labelInputs.last()
  await lastLabel.fill('Estado')
  const lastIndex = (await labelInputs.count()) - 1
  await chooseInSelect(`field-type-${lastIndex}`, 'lista de valores')

  await check('el panel del bloque ofrece la configuración del kanban', async () => {
    await page.waitForSelector('[data-testid="kanban-config"]')
    return true
  })

  await chooseInSelect('kanban-columns', 'Estado')
  await check('con enum elegido el badge desaparece y el tablero se pinta', async () => {
    await page.waitForSelector('studio-canvas-kanban')
    await page.waitForTimeout(400)
    const badge = await page.getByText('diseño · aún no generable').count()
    const text = (await page.locator('studio-canvas-kanban').textContent()) ?? ''
    return badge === 0 && text.includes('columnas por Estado')
  })

  await check('el tablero reparte tarjetas de muestra', async () => {
    return (await page.locator('[data-testid^="kanban-card-"]').count()) > 1
  })

  await page.screenshot({ path: 'e2e-61-kanban.png' })

  if (errors.length) console.log('errores de página:', errors)
  await browser.close()
  if (failures.length || errors.length) process.exit(1)
}

void main()

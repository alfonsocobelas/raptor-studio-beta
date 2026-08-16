/**
 * Smoke del bloque Formulario (spec 48). Los specs de vitest no montan los
 * componentes del lienzo (input() de señal, JIT), así que el gesto real va aquí:
 * pulsar «Formulario» en la paleta y ver la página de alta pintada en la vista.
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-form-block.ts
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

  await check('la paleta ofrece el bloque Formulario', async () => {
    await page.waitForSelector('[data-testid="block-tool-form"]')
    return (await page.getByTestId('block-tool-form').textContent())?.includes('Formulario') ?? false
  })

  // una vista con tabla: «Pedidos» → entidad pedido (masculina en la heurística del draft)
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pedidos')
  await page.getByTestId('new-page-ok').click()
  await page.waitForSelector('[data-testid="table-create"]')

  await page.getByTestId('block-tool-form').click()
  await check('pulsar Formulario añade el bloque con la entidad de la vista', async () => {
    await page.waitForSelector('[data-testid="canvas-form-title"]')
    return (await page.getByTestId('canvas-form-title').textContent())?.trim() === 'Nuevo pedido'
  })

  await check('el bloque pinta los campos del draft como controles', async () => {
    return (await page.locator('studio-canvas-form [data-testid="form-field-nombre"] input[type="text"]').count()) === 1
  })

  await check('el bloque no se marca «aún no generable»', async () => {
    const badge = await page.locator('studio-canvas-form').locator('xpath=ancestor::*[contains(., "aún no generable")]').count()
    return badge === 0 || !(await page.getByText('diseño · aún no generable').count())
  })

  await page.screenshot({ path: 'e2e-48-form-block.png' })

  if (errors.length) console.log('errores de página:', errors)
  await browser.close()
  if (failures.length || errors.length) process.exit(1)
}

void main()

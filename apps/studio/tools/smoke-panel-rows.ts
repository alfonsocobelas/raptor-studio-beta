/**
 * Smoke de la MÉTRICA DE LOS PANELES: en una fila de panel todos los controles miden lo
 * mismo, y la flecha del desplegable mide igual en todos los paneles del estudio.
 *
 * Nace de un defecto visto el 2026-08-20: `.studio-row` vestía `input` y `select` nativos,
 * pero `app-select` es un custom element y se colaba con su tamaño por defecto —36px de
 * alto, letra de 14, flecha de 16— junto a inputs de 31px y letra 12,5. La columna de
 * controles salía escalonada y con dos tipografías, y la flecha no pegaba con los 13px que
 * usan el raíl de Vistas y el inspector.
 *
 * Aquí no se comprueba una clase: se MIDE en el navegador, que es donde vive el defecto.
 *
 *   npx ts-node -T -r tsconfig-paths/register tools/smoke-panel-rows.ts
 *   (con `npm run web` corriendo; BASE_URL y SHOTS_DIR opcionales)
 */
import { chromium, type Locator, type Page } from 'playwright'

const BASE = process.env['BASE_URL'] ?? 'http://localhost:4316'
const SHOTS = process.env['SHOTS_DIR']

/** La flecha del desplegable, la misma en todo el estudio: la del raíl de Vistas. */
const ARROW = 13

interface Metrics {
  height: number
  fontSize: number
}

const problems: string[] = []

function check(condition: boolean, message: string): void {
  if (condition) console.log(`✓ ${message}`)
  else problems.push(message)
}

async function shot(page: Page, name: string): Promise<void> {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

async function metrics(target: Locator): Promise<Metrics> {
  return target.evaluate(element => {
    const box = element.getBoundingClientRect()
    return { height: box.height, fontSize: parseFloat(getComputedStyle(element).fontSize) }
  })
}

/** El disparador del desplegable: el botón que enseña el valor y abre el popover. */
function trigger(scope: Locator): Locator {
  return scope.locator('app-select button').first()
}

function arrow(scope: Locator): Locator {
  return scope.locator('app-select svg').first()
}

async function arrowSize(scope: Locator, where: string): Promise<void> {
  const size = await arrow(scope).evaluate(element => element.getBoundingClientRect().height)
  check(size === ARROW, `${where}: la flecha mide ${size}px (esperados ${ARROW})`)
}

/** Una fila de panel: la etiqueta a la izquierda y su control a la derecha. */
async function sameRowMetrics(page: Page, panel: string, inputId: string, where: string): Promise<void> {
  const scope = page.locator(panel)
  const input = await metrics(scope.locator(`input#${inputId}`))
  const select = await metrics(trigger(scope))
  check(
    Math.abs(input.height - select.height) <= 1,
    `${where}: el desplegable mide ${select.height.toFixed(1)}px de alto y el input de al lado ${input.height.toFixed(1)}px`
  )
  check(
    input.fontSize === select.fontSize,
    `${where}: el desplegable escribe a ${select.fontSize}px y el input de al lado a ${input.fontSize}px`
  )
  await arrowSize(scope, where)
}

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } })
  page.setDefaultTimeout(15000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle', timeout: 60000 })

  // el diseño del taller: cuatro entidades, vistas con tabla y un flujo con estados
  await page.getByTestId('design-menu-toggle').click()
  await page.getByTestId('design-open-taller').click()
  await page.getByTestId('mode-views').waitFor()

  // Vistas · inspector de la entidad elegida en el lienzo
  await page.getByTestId('mode-views').click()
  await page.getByTestId('view-item-1').click()
  await page.locator('studio-canvas-table table').first().click()
  await page.getByTestId('inspector').waitFor()
  await arrowSize(page.locator('studio-inspector'), 'Vistas · inspector')
  await shot(page, 'smoke-rows-1-vistas')

  // Modelo · pestaña Campo: «Nombre» es un input y «Tipo» un desplegable, misma fila
  await page.getByTestId('mode-model').click()
  await page.getByTestId('model-field-cliente-nombre').click()
  await page.getByTestId('field-name').waitFor()
  await sameRowMetrics(page, 'studio-model-panel', 'field-name', 'Modelo · Campo')
  await shot(page, 'smoke-rows-2-modelo')

  // Flujos · el nodo elegido: «Texto» input, «Entidad» desplegable
  await page.getByTestId('mode-flows').click()
  const node = page.locator('[data-testid^="flow-node-"]').first()
  if (await node.count()) {
    await node.click()
    if (await page.getByTestId('flow-node-text').count()) {
      await sameRowMetrics(page, 'studio-flow-panel', 'flow-node-text', 'Flujos · nodo')
      await shot(page, 'smoke-rows-3-flujos')
    } else console.log('· Flujos: el nodo elegido no trae fila de texto, no se mide')
  } else console.log('· Flujos: el diseño no tiene nodos, no se mide')

  if (errors.length) problems.push(`errores de consola: ${errors.join(' | ')}`)

  await browser.close()

  if (problems.length) {
    for (const problem of problems) console.error(`✗ ${problem}`)
    process.exit(1)
  }
  console.log('\n✓ los paneles miden igual y la flecha es la misma en todos')
}

main()

/**
 * Smoke de VALIDACIÓN de las specs 43 y 46 en el estudio: la máquina de estados se
 * diseña con gestos (arrastrar un asa crea la transición, el editor la nombra) y la
 * matriz de accesos se edita a mano (quitar «Ver» a Consulta, repartir transiciones).
 * Deja el diseño en `.studio/designs/<slug>.json` para que la fase en vivo lo genere.
 *
 *   npx tsx tools/smoke-machine-access.ts   (con `npm run web` y `npm run studio:api`)
 *   SHOTS_DIR opcional para dejar capturas · KEEP=1 para no borrar el diseño
 */
import { chromium, type Page } from 'playwright'
import { readFileSync } from 'fs'
import * as path from 'path'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'
const API = process.env['STUDIO_API'] ?? 'http://localhost:3400/api/v1'
const SHOTS = process.env['SHOTS_DIR']
const SLUG = process.env['SLUG'] ?? 'accesos'
const ROOT = path.resolve(__dirname, '../../..')

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function shot(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

/** Base: el diseño del taller (máquina de 8 transiciones) con otro nombre y otros puertos. */
function baseDesign(): Record<string, unknown> {
  const taller = JSON.parse(readFileSync(path.join(ROOT, '.studio/designs/taller.json'), 'utf8'))
  return {
    ...taller,
    appName: SLUG,
    ports: { api: 3021, web: 4331, postgres: 5453, postgresTest: 5454 }
  }
}

/**
 * Reescribe un input del editor como lo haría una persona: clic, borrar con Backspace,
 * teclear y Tab. Ni `fill()` ni «seleccionar todo» valen aquí: sacan el foco del input y
 * las teclas caen en el lienzo (la «e» abre el alta de entidad) — el atajo del raíl solo
 * se inhibe mientras el foco está DENTRO del input.
 */
async function retype(page: Page, testId: string, value: string): Promise<void> {
  const input = page.getByTestId(testId)
  const current = await input.inputValue()
  await input.click()
  await page.keyboard.press('End')
  for (let i = 0; i < current.length; i++) await page.keyboard.press('Backspace')
  await page.keyboard.type(value)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
}

/** Espera a que la celda quede en el estado pedido: el click no re-renderiza al instante. */
async function waitPressed(page: Page, testId: string, expected: 'true' | 'false'): Promise<void> {
  for (let i = 0; i < 25; i++) {
    if ((await page.getByTestId(testId).getAttribute('aria-pressed')) === expected) return
    await page.waitForTimeout(200)
  }
  fail(`${testId} no quedó en aria-pressed=${expected}`)
}

async function main(): Promise<void> {
  const seeded = await fetch(`${API}/studio/designs/${SLUG}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(baseDesign())
  })
  if (!seeded.ok) fail(`no se pudo sembrar el diseño (${seeded.status}): ${await seeded.text()}`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
  page.setDefaultTimeout(20000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(WEB, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(slug => localStorage.setItem('studio.activeDesign', slug), SLUG)
  await page.reload({ waitUntil: 'networkidle' })

  // ── spec 43: la máquina se diseña con gestos ────────────────────────────────
  await page.getByTestId('mode-model').click()
  await page.getByTestId('model-node-orden').click()
  await page.getByTestId('model-tab-entity').click()
  await page.getByTestId('lifecycle-edit').click()
  await page.getByTestId('state-diagram').waitFor()
  await shot(page, 'spec43-1-maquina-heredada')

  const before = await page.locator('[data-testid^="state-edge-"]').count()

  // arrastrar del asa de «rechazada» a la caja de «presupuestada»: una transición nueva
  // la cámara del lienzo encaja al entrar: leer las cajas ANTES movía el gesto a coordenadas viejas
  await page.waitForTimeout(1000)
  const handle = await page.getByTestId('state-handle-rechazada').boundingBox()
  if (!handle) fail('el diagrama no expone el asa de «rechazada»')
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  const target = await page.getByTestId('state-node-presupuestada').boundingBox()
  if (!target) fail('el diagrama no expone la caja de «presupuestada»')
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 })
  if (!(await page.getByTestId('state-ghost-edge').count())) fail('no se tiende la flecha fantasma')
  await shot(page, 'spec43-2-flecha-fantasma')
  await page.mouse.up()

  // el verbo por defecto viene del destino: a-presupuestada
  await page.getByTestId('state-edge-a-presupuestada:rechazada').waitFor()
  const after = await page.locator('[data-testid^="state-edge-"]').count()
  if (after !== before + 1) fail(`el gesto no creó la transición (${before} → ${after} flechas)`)

  // nombrarla: verbo «reabrir», botón «Reabrir presupuesto»
  await page.getByTestId('state-edge-a-presupuestada:rechazada').click()
  await page.getByTestId('state-editor').waitFor()
  await retype(page, 'state-edit-label', 'Reabrir presupuesto')
  await retype(page, 'state-edit-name', 'reabrir')
  await page.waitForTimeout(500)
  await shot(page, 'spec43-3-transicion-nombrada')
  console.log('✓ spec 43: transición «reabrir» creada con el gesto y nombrada en el editor')

  // la sub-vista se cierra sola al editar; si sigue abierta, se sale por el botón
  if (await page.getByTestId('lifecycle-back').count()) await page.getByTestId('lifecycle-back').click()

  // ── spec 46: la matriz de accesos se edita a mano ────────────────────────────
  await page.getByTestId('mode-access').click()
  await page.getByTestId('access-role-viewer').click()
  await page.getByText('Qué puede hacer Consulta').waitFor()
  const recambioView = page.getByTestId('access-cell-recambio-view')
  await recambioView.waitFor()
  if ((await recambioView.getAttribute('aria-pressed')) !== 'true') fail('Consulta no parte con Ver en recambios')
  await recambioView.click()
  await waitPressed(page, 'access-cell-recambio-view', 'false')
  await shot(page, 'spec46-1-consulta-sin-ver')
  console.log('✓ spec 46: Consulta pierde «Ver» en Recambios')

  // el rol Usuario: «aprobar» es cosa de admin, «terminar» suya, y «facturar» se le retira aquí
  await page.getByTestId('access-role-user').click()
  await page.getByText('Qué puede hacer Usuario').waitFor()
  const aprobar = page.getByTestId('access-cell-orden-aprobar')
  await aprobar.waitFor()
  if ((await aprobar.getAttribute('aria-pressed')) !== 'false') fail('«aprobar» no venía restringida a admin')
  if ((await page.getByTestId('access-cell-orden-terminar').getAttribute('aria-pressed')) !== 'true') {
    fail('«terminar» no venía concedida a Usuario')
  }
  await page.getByTestId('access-cell-orden-facturar').click()
  await waitPressed(page, 'access-cell-orden-facturar', 'false')
  await shot(page, 'spec46-2-transiciones-repartidas')
  console.log('✓ spec 46: «aprobar» solo admin, «terminar» de Usuario, «facturar» retirada a Usuario')

  if (errors.length) fail(`errores en consola: ${errors.join(' | ')}`)

  // el autosave tiene que haber escrito ya: se comprueba en el fichero, no en el lienzo
  await page.waitForTimeout(3000)
  await browser.close()

  const saved = await (await fetch(`${API}/studio/designs/${SLUG}`)).json()
  const orden = saved.resources.find((r: { name: string }) => r.name === 'orden')
  const recambio = saved.resources.find((r: { name: string }) => r.name === 'recambio')
  const transitions: string[] = orden.state.transitions.map((t: { name: string }) => t.name)
  if (!transitions.includes('reabrir')) fail(`el diseño guardado no lleva «reabrir»: ${transitions.join(', ')}`)
  if (recambio.access.view.includes('viewer')) fail('el diseño guardado sigue dando Ver a Consulta en recambios')
  if (orden.access.transitions['aprobar'].length) fail('«aprobar» no quedó solo para admin')
  if (orden.access.transitions['facturar'].length) fail('«facturar» no quedó retirada a Usuario')
  if (!orden.access.transitions['terminar'].includes('user')) fail('«terminar» no quedó concedida a Usuario')

  if (!process.env['KEEP']) await fetch(`${API}/studio/designs/${SLUG}`, { method: 'DELETE' })
  console.log('✓ el diseño guardado lleva la máquina editada y la matriz explícita')
}

void main()

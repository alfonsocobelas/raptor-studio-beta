/**
 * Smoke del modo ACCESOS (spec 46): una entidad, la pestaña Accesos pinta el raíl con la
 * matriz y el lienzo con el diagrama de casos de uso derivado. Quitar «Ver» a Consulta
 * hace desaparecer su arista del diagrama y deja la matriz explícita en el schema
 * exportado. Solo lectura en el lienzo: el raíl edita, el diagrama reacciona.
 *
 *   npx tsx tools/smoke-access.ts   (con `npm run web` corriendo)
 *   BASE_URL y SHOTS_DIR opcionales (capturas solo si SHOTS_DIR está definido)
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env['BASE_URL'] ?? 'http://localhost:4316'
const SHOTS = process.env['SHOTS_DIR']

async function shot(page: Page, name: string): Promise<void> {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(15000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })

  // una vista de listado → una entidad (factura)
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Facturas')
  await page.getByTestId('new-page-ok').click()

  // modo Accesos: raíl con la matriz y lienzo con el diagrama derivado
  await page.getByTestId('mode-access').click()
  await page.getByTestId('access-entity-factura').waitFor()
  await page.getByTestId('access-diagram').waitFor()
  await page.getByTestId('access-edge-viewer-factura:view').waitFor()
  await shot(page, 'smoke-access-1-politica-actual')

  // el admin está fijo: marcado y deshabilitado
  const admin = page.getByTestId('access-factura-view-admin')
  if (!(await admin.isChecked()) || !(await admin.isDisabled())) fail('la columna Admin no va fija y marcada')

  // quitar «Ver» a Consulta: su arista desaparece del diagrama
  await page.getByTestId('access-factura-view-viewer').click()
  await page.getByTestId('access-edge-viewer-factura:view').waitFor({ state: 'detached' })
  // la de admin sigue: admin siempre puede todo
  await page.getByTestId('access-edge-admin-factura:view').waitFor()
  await shot(page, 'smoke-access-2-viewer-sin-ver')
  console.log('✓ diagrama: la arista de Consulta cae al desmarcar Ver; la de admin permanece')

  // la matriz explícita viaja al schema exportado
  const json = (await page.getByTestId('schema-json').textContent()) ?? '{}'
  const schema = JSON.parse(json) as { resources?: { name: string; access?: { view?: string[] } }[] }
  const factura = schema.resources?.find(r => r.name === 'factura')
  if (!factura?.access || JSON.stringify(factura.access.view) !== JSON.stringify(['user'])) {
    fail(`el schema exportado no lleva la matriz esperada (access.view=['user']): ${JSON.stringify(factura?.access)}`)
  }
  console.log('✓ schema: access.view queda explícito y sin viewer')

  if (errors.length) fail(`errores de página: ${errors.join(' · ')}`)
  await browser.close()
  console.log('✓ SMOKE ACCESS OK')
}

main().catch(e => fail(String(e)))

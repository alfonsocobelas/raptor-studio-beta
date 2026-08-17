/**
 * Smoke del modo ACCESOS (spec 49): raíl de roles + tabla entidad×capacidad (Ver/Crear/
 * Editar/Borrar), panel de resumen con acciones de columna y pivote Entidad. Quitar «Ver»
 * a Consulta deja la matriz granular explícita en el schema exportado.
 *
 *   npx tsx tools/smoke-access.ts   (con `npm run web` corriendo)
 *   BASE_URL y SHOTS_DIR opcionales (capturas solo si SHOTS_DIR está definido)
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env['BASE_URL'] ?? 'http://localhost:4316'
const SHOTS = process.env['SHOTS_DIR']

async function shot(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  // deja terminar los transition-colors (150ms): si no, la captura pilla dos pills a medias
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${SHOTS}/${name}.png` })
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

  // modo Accesos: raíl de roles con Usuario activo y la tabla del rol
  await page.getByTestId('mode-access').click()
  const userCard = page.getByTestId('access-role-user')
  await userCard.waitFor()
  if ((await userCard.getAttribute('aria-current')) !== 'true') fail('Usuario no llega activo por defecto')
  const view = page.getByTestId('access-cell-factura-view')
  if ((await view.getAttribute('aria-pressed')) !== 'true') fail('la política actual no marca Ver para Usuario')
  await shot(page, 'smoke-access-1-tabla-rol')
  console.log('✓ tabla por rol: Usuario activo con la política actual')

  // admin se mira pero no se toca
  await page.getByTestId('access-role-admin').click()
  await page.getByText('Qué puede hacer Administrador').waitFor()
  if (!(await page.getByTestId('access-cell-factura-delete').isDisabled())) fail('las celdas de admin no van fijas')

  // Consulta pierde «Ver»: el resumen cae a 0 y la matriz explícita viaja al schema
  await page.getByTestId('access-role-viewer').click()
  await page.getByText('Qué puede hacer Consulta').waitFor()
  await page.getByTestId('access-cell-factura-view').click()
  await page
    .getByTestId('access-cell-factura-view')
    .and(page.locator('[aria-pressed="false"]'))
    .waitFor()
  const visibles = (await page.getByTestId('access-summary-view').textContent()) ?? ''
  if (!/Puede ver\s*0\/1/.test(visibles)) fail(`el resumen no refleja la retirada de Ver: «${visibles.trim()}»`)
  const completo = (await page.getByTestId('access-summary-full').textContent()) ?? ''
  if (!completo.includes('0/1')) fail(`el acceso completo debería ser 0/1: «${completo.trim()}»`)
  await shot(page, 'smoke-access-2-viewer-sin-ver')

  const json = (await page.getByTestId('schema-json').textContent()) ?? '{}'
  const schema = JSON.parse(json) as { resources?: { name: string; access?: Record<string, string[]> }[] }
  const factura = schema.resources?.find(r => r.name === 'factura')
  const esperado = { view: ['user'], create: ['user'], edit: ['user'], delete: ['user'] }
  if (JSON.stringify(factura?.access) !== JSON.stringify(esperado)) {
    fail(`el schema exportado no lleva la matriz granular esperada: ${JSON.stringify(factura?.access)}`)
  }
  console.log('✓ schema: la matriz granular queda explícita y sin viewer en Ver')

  // pivote Entidad: filas de rol, admin fija
  await page.getByTestId('access-pivot-entity').click()
  const adminView = page.getByTestId('access-ecell-admin-view')
  await adminView.waitFor()
  if (!(await adminView.isDisabled())) fail('la fila de admin del pivote Entidad no va fija')
  if ((await page.getByTestId('access-ecell-viewer-view').getAttribute('aria-pressed')) !== 'false') {
    fail('el pivote Entidad no refleja la retirada de Ver a Consulta')
  }
  await shot(page, 'smoke-access-3-pivote-entidad')
  console.log('✓ pivote Entidad: filas de rol coherentes con la matriz')

  // tema oscuro sobre la tabla por rol
  await page.getByTestId('access-pivot-role').click()
  await page.getByTestId('studio-theme').click()
  await page.getByTestId('access-cell-factura-view').waitFor()
  await shot(page, 'smoke-access-5-oscuro')

  if (errors.length) fail(`errores de página: ${errors.join(' · ')}`)
  await browser.close()
  console.log('✓ SMOKE ACCESS OK')
}

main().catch(e => fail(String(e)))

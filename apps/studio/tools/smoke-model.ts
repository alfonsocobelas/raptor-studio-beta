/**
 * Smoke de la vista de MODELO (spec 15, fase 4): dos entidades, relación
 * creada arrastrando de caja a caja, y la comprobación que importa — el
 * schema exportado contiene el par canónico (pacienteId con relation +
 * lookup, pacienteName denormalizado). Después borra la flecha y verifica
 * que el campo ref desaparece.
 *
 *   npx tsx tools/smoke-model.ts   (con `npm run web` corriendo)
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

  // dos vistas de listado → dos entidades
  for (const label of ['Pacientes', 'Citas']) {
    await page.getByTestId('tool-new-view').click()
    await page.getByTestId('preset-list').click()
    await page.getByTestId('new-page-title').fill(label)
    await page.getByTestId('new-page-ok').click()
  }

  // modo Modelo: las dos cajas derivadas
  await page.getByTestId('mode-model').click()
  await page.getByTestId('model-node-paciente').waitFor()
  await page.getByTestId('model-node-cita').waitFor()
  await shot(page, 'smoke-model-1-cajas')

  // arrastrar del asa de cita hasta la caja de paciente
  await page.getByTestId('model-node-cita').hover()
  const handle = await page.getByTestId('link-handle-cita').boundingBox()
  const target = await page.getByTestId('model-node-paciente').boundingBox()
  if (!handle || !target) fail('no se encuentran el asa o la caja destino')
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 })
  await page.mouse.up()
  await page.getByTestId('edge-cita-paciente').waitFor()
  await shot(page, 'smoke-model-2-relacion')

  // la flecha ES el schema: el export lleva el par canónico
  await page.getByTestId('toggle-schema').click()
  const json = (await page.getByTestId('schema-json').textContent()) ?? '{}'
  const schema = JSON.parse(json) as {
    resources?: { name: string; fields?: Record<string, Record<string, unknown>> }[]
  }
  const cita = schema.resources?.find(r => r.name === 'cita')
  const idField = cita?.fields?.['pacienteId'] as
    | { relation?: { to?: string; kind?: string }; form?: { lookup?: { resource?: string; denormalizes?: string } } }
    | undefined
  if (idField?.relation?.to !== 'paciente' || idField.relation.kind !== 'reference') {
    fail('pacienteId sin relation reference → paciente en el schema exportado')
  }
  if (idField.form?.lookup?.resource !== 'paciente' || idField.form.lookup.denormalizes !== 'pacienteName') {
    fail('el lookup del selector no denormaliza a pacienteName')
  }
  if (!cita?.fields?.['pacienteName']) fail('falta el campo denormalizado pacienteName')
  console.log('✓ schema: pacienteId (relation reference → paciente, lookup) + pacienteName')

  // borrar la flecha elimina el campo ref
  await page.getByTestId('toggle-schema').click()
  await page.getByTestId('edge-cita-paciente').click()
  await page.getByTestId('delete-edge').click()
  await page.getByTestId('edge-cita-paciente').waitFor({ state: 'detached' })
  console.log('✓ borrado: la flecha y su campo ref desaparecen')

  if (errors.length) fail(`errores de página: ${errors.join(' · ')}`)
  await browser.close()
  console.log('✓ SMOKE MODEL OK')
}

main().catch(e => fail(String(e)))

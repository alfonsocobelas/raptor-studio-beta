/**
 * Smoke del diálogo de formulario del lienzo (modo Vistas). Los specs de vitest no
 * pueden montar `studio-canvas-table` —su `input()` de señal necesita el compilador
 * AOT—, así que la paridad con la app emitida se verifica aquí: el botón «Nuevo X»
 * del cromo de la tabla y el lápiz de cada fila abren el mismo diálogo mock.
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-form-dialog.ts
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

  // una vista con tabla: «Pacientes» → recurso paciente, género masculino (heurística del draft)
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pacientes')
  await page.getByTestId('new-page-ok').click()
  await page.waitForSelector('[data-testid="table-create"]')

  await check('el cromo de la tabla enseña el botón «Nuevo paciente»', async () => {
    const text = await page.getByTestId('table-create').textContent()
    return (text ?? '').includes('Nuevo paciente')
  })

  await page.getByTestId('table-create').click()
  await check('pulsarlo abre el diálogo de alta con el título del generador', async () => {
    const title = await page.getByTestId('form-dialog-title').textContent()
    return (title ?? '').trim() === 'Nuevo paciente'
  })
  await check('la descripción es la de alta', async () => {
    const description = await page.getByTestId('form-dialog-description').textContent()
    return (description ?? '').trim() === 'Introduce los datos del nuevo paciente'
  })
  await check('el campo Nombre del draft se pinta como input de texto', async () => {
    return (await page.locator('[data-testid="form-field-nombre"] input[type="text"]').count()) === 1
  })
  await page.screenshot({ path: 'e2e-48-form-dialog-alta.png' })

  await page.getByTestId('form-dialog-cancel').click()
  await check('Cancelar cierra el diálogo', async () => {
    // el DOM repinta un tick después del clic: la lectura inmediata pilla la vista vieja
    await page.waitForSelector('[data-testid="form-dialog"]', { state: 'detached', timeout: 3000 })
    return true
  })

  await page.getByTestId('row-edit-0').click()
  await check('el lápiz de la fila abre el diálogo en edición', async () => {
    const title = await page.getByTestId('form-dialog-title').textContent()
    return (title ?? '').trim() === 'Editar paciente'
  })
  await check('la descripción es la de edición', async () => {
    const description = await page.getByTestId('form-dialog-description').textContent()
    return (description ?? '').trim() === 'Modifica los datos del paciente'
  })
  await check('en edición el campo llega relleno con el dato de la fila', async () => {
    const value = await page.locator('[data-testid="form-field-nombre"] input[type="text"]').inputValue()
    return value.trim().length > 0
  })
  await page.screenshot({ path: 'e2e-48-form-dialog-edicion.png' })

  await page.getByTestId('form-dialog-save').click()
  await check('Guardar solo cierra (es preview)', async () => {
    await page.waitForSelector('[data-testid="form-dialog"]', { state: 'detached', timeout: 3000 })
    return true
  })

  if (errors.length) console.log('errores de página:', errors)
  await browser.close()
  if (failures.length || errors.length) process.exit(1)
}

void main()

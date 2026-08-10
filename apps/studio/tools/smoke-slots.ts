/**
 * Smoke del wizard de ranuras (spec 23). Verifica el circuito manifiesto → HTTP →
 * formulario: las ranuras se pintan solas, las de un proveedor no se pintan y una
 * combinación inválida queda deshabilitada en vivo.
 *
 * Por defecto NO intercepta: consume el endpoint real del studio-api, porque interceptar
 * la ruta ya ocultó una vez que el path del frontend no existía (404). Con STUB_SLOTS=1
 * se sirve `tools/slots.json` desde Playwright para poder correrlo sin backend.
 *
 *   npx tsx tools/smoke-slots.ts   (con `npm run web` y `npm run studio:api` corriendo)
 */
import { readFileSync } from 'fs'
import * as path from 'path'
import { chromium } from 'playwright'

const ACELERADOR_ROOT = process.env['ACELERADOR_ROOT'] ?? path.resolve(__dirname, '../../..')
const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'

async function main(): Promise<void> {
  const manifest = JSON.parse(readFileSync(path.join(ACELERADOR_ROOT, 'tools/slots.json'), 'utf-8'))
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1700, height: 950 }
  })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  if (process.env['STUB_SLOTS'] === '1') {
    await page.route('**/studio/generate/slots', route => route.fulfill({ json: manifest }))
  }

  await page.goto(`${WEB}/studio`, {
    waitUntil: 'networkidle',
    timeout: 90000
  })
  // el botón de generar exige un diseño: una vista con un bloque basta
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pacientes')
  await page.getByTestId('new-page-ok').click()

  await page.click('[data-testid="open-wizard"]')
  await page.waitForSelector('[data-testid="wizard-slots"]')

  const failures: string[] = []
  const check = async (description: string, assertion: () => Promise<boolean>): Promise<void> => {
    const ok = await assertion()
    console.log(`${ok ? '✅' : '❌'} ${description}`)
    if (!ok) failures.push(description)
  }

  // 1. cada ranura elegible del manifiesto tiene su grupo de radios
  for (const slot of manifest.slots.filter((s: { providers: unknown[] }) => s.providers.length > 1)) {
    for (const provider of slot.providers) {
      await check(`${slot.name}=${provider.value} está en el formulario`, async () =>
        page.isVisible(`[data-testid="slot-${slot.name}-${provider.value}"]`)
      )
    }
  }

  // 2. las ranuras de un solo proveedor no se pintan: no hay nada que elegir
  for (const slot of manifest.slots.filter((s: { providers: unknown[] }) => s.providers.length === 1)) {
    await check(`${slot.name} (un solo proveedor) NO se pinta`, async () => {
      return (await page.locator(`[data-testid^="slot-${slot.name}-"]`).count()) === 0
    })
  }

  // 3. el gate del generador, contado antes de generar: mongo deja fuera auth single-tenant.
  // Se espera por el estado (no se lee al vuelo): el ciclo de Angular es asíncrono
  const settles = async (selector: string): Promise<boolean> => {
    try {
      await page.waitForSelector(selector, { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  await check('auth=single-tenant está habilitado con postgres', async () =>
    settles('[data-testid="slot-auth-single-tenant"]:enabled')
  )
  await page.click('[data-testid="slot-database-mongo"]')
  await check('al elegir mongo, auth=single-tenant se deshabilita', async () =>
    settles('[data-testid="slot-auth-single-tenant"]:disabled')
  )

  // 4. el comando refleja la selección y omite la ranura no elegible
  await page.fill('[data-testid="wizard-name"]', 'smoke-slots')
  const command = (await page.textContent('[data-testid="wizard-command"]')) ?? ''
  await check(`el comando lleva --database=mongo (${command.trim()})`, async () => command.includes('--database=mongo'))
  await check('el comando no lleva --infra=', async () => !command.includes('--infra='))

  await check('sin errores de consola', async () => errors.length === 0)
  if (errors.length) console.error(errors.join('\n'))

  await browser.close()
  if (failures.length) {
    console.error(`\n✗ ${failures.length} comprobación(es) fallaron`)
    process.exit(1)
  }
  console.log('\n🏅 Wizard dibujado desde el manifiesto: OK')
}

void main()

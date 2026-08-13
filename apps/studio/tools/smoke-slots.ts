/**
 * Smoke de la pantalla «Antes de generar» (specs 23 y 41). Verifica el circuito
 * manifiesto → HTTP → tarjetas: las ranuras se pintan solas, las de un proveedor no se
 * pintan y una combinación inválida queda deshabilitada en vivo.
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

  // El preset visual no se pregunta aquí: lo manda el lienzo (spec 41)
  const asked = (slot: { name: string; providers: unknown[] }): boolean =>
    slot.providers.length > 1 && slot.name !== 'design'

  // 1. cada ranura elegible del manifiesto tiene su fila de tarjetas
  for (const slot of manifest.slots.filter(asked)) {
    for (const provider of slot.providers) {
      await check(`${slot.name}=${provider.value} está en la pantalla`, async () =>
        page.isVisible(`[data-testid="slot-${slot.name}-${provider.value}"]`)
      )
    }
  }

  // 2. las que no se preguntan no se pintan: un solo proveedor, o el preset del lienzo
  for (const slot of manifest.slots.filter((s: { name: string; providers: unknown[] }) => !asked(s))) {
    await check(`${slot.name} NO se pinta`, async () => {
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

  // 4. el comando vive en el paso 3, al que se llega con el botón del raíl
  await page.click('[data-testid="generate-primary"]')
  await page.waitForSelector('[data-testid="generate-step-generate"]')
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
  console.log('\n🏅 Pantalla de generar dibujada desde el manifiesto: OK')
}

void main()

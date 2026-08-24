/**
 * Smoke visual de las vistas de sistema (spec 57): las 3 vistas (login/usuarios/mi cuenta)
 * en los 3 presets (actual/cabina/suite) — 9 capturas para la verificación con Alfonso
 * contra las pantallas de la referencia. Falla si alguna vista no monta o la página
 * lanza errores.
 *
 *   npx tsx tools/smoke-system-views.ts   (con `npm run web` corriendo)
 *   BASE_URL y SHOTS_DIR opcionales (capturas solo si SHOTS_DIR está definido)
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env['BASE_URL'] ?? 'http://localhost:4316'
const SHOTS = process.env['SHOTS_DIR']
const VIEWS = ['login', 'users', 'account'] as const
const PRESETS = ['actual', 'cabina', 'suite'] as const

async function shot(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  // deja terminar los transition-colors (150ms): si no, la captura pilla estilos a medias
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
  await page.getByTestId('system-view-login').waitFor()

  for (const preset of PRESETS) {
    // el selector de preset vive en la pestaña Piel del panel derecho (ids reales del panel)
    await page.getByTestId('panel-tab-skin').click()
    await page.getByTestId(`preview-preset-${preset}`).click()

    for (const view of VIEWS) {
      await page.getByTestId(`system-view-${view}`).click()
      await page.getByTestId('system-view').waitFor()
      await shot(page, `smoke-system-${view}-${preset}`)
      console.log(`✓ ${view} × ${preset}`)
    }
    // volver al diseño: con una vista de sistema abierta el panel derecho está plegado
    await page.getByTestId('system-view-close').click()
  }

  if (errors.length) fail(`errores de página: ${errors.join(' | ')}`)
  await browser.close()
  console.log('Smoke de vistas de sistema: OK (3 vistas × 3 presets)')
}

main().catch(e => fail(String(e)))

/**
 * Smoke visual de las vistas de sistema (spec 57): las 3 vistas (login/usuarios/
 * mi cuenta) en los 3 presets (actual/cabina/suite) — 9 capturas para la
 * verificación con Alfonso contra las pantallas de la referencia.
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-system-views.ts
 *   (con `npm run web` corriendo)
 */
import { chromium } from 'playwright'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'
const VIEWS = ['login', 'users', 'account'] as const
const PRESETS = ['actual', 'cabina', 'suite'] as const

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1700, height: 950 } })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(`${WEB}/studio`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="system-view-login"]')

  for (const preset of PRESETS) {
    await page.getByTestId('panel-tab-skin').click().catch(() => undefined)
    // la pestaña de piel puede llamarse distinto: probamos por el testid del preset directamente
    if ((await page.getByTestId(`preview-preset-${preset}`).count()) === 0) {
      for (const tab of ['panel-tab-preset', 'panel-tab-skin', 'panel-tab-piel']) {
        await page
          .getByTestId(tab)
          .click()
          .catch(() => undefined)
        if (await page.getByTestId(`preview-preset-${preset}`).count()) break
      }
    }
    await page.getByTestId(`preview-preset-${preset}`).click()
    for (const view of VIEWS) {
      await page.getByTestId(`system-view-${view}`).click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `e2e-57-${view}-${preset}.png` })
      console.log(`📸 e2e-57-${view}-${preset}.png`)
    }
  }

  if (errors.length) console.log('errores de página:', errors)
  await browser.close()
  if (errors.length) process.exit(1)
}

void main()

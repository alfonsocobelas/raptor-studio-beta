/**
 * Smoke del checkbox «infra aprovisionada» (spec 62). Verifica el circuito completo en el
 * navegador real: toda app sale con nube (Raptor Cloud por defecto desde 2026-08-24, «Sin
 * nube» ya no se ofrece), con raptor NO hay checkbox (esa nube la aprovisionamos nosotros),
 * aparece al elegir una nube del cliente, y al generar el flag viaja en el body del POST.
 * La generación se intercepta SIEMPRE: este smoke comprueba la petición, no la obra —
 * generar de verdad tardaría minutos y ensuciaría el workspace.
 *
 *   npx tsx tools/smoke-provisioned-infra.ts   (con `npm run web` corriendo; studio-api opcional)
 */
import { chromium } from 'playwright'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1700, height: 950 } })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  let body: Record<string, unknown> | null = null
  await page.route('**/studio/generate/stream', route => {
    body = route.request().postDataJSON() as Record<string, unknown>
    route.fulfill({
      contentType: 'application/x-ndjson',
      body: `${JSON.stringify({ type: 'result', ok: true, output: '', root: 'apps/smoke', elapsedMs: 1 })}\n`
    })
  })

  await page.goto(`${WEB}/studio`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-list').click()
  await page.getByTestId('new-page-title').fill('Pacientes')
  await page.getByTestId('new-page-ok').click()
  await page.click('[data-testid="open-wizard"]')
  await page.waitForSelector('[data-testid="wizard-slots"]')

  const failures: string[] = []
  const check = async (description: string, assertion: () => Promise<boolean>): Promise<void> => {
    const ok = await assertion().catch(() => false)
    console.log(`${ok ? '✅' : '❌'} ${description}`)
    if (!ok) failures.push(description)
  }

  await check('«Sin nube» ya no se ofrece', async () =>
    (await page.locator('[data-testid="slot-infra-none"]').count()) === 0
  )

  await check('Raptor Cloud viene elegida por defecto', async () =>
    (await page.locator('[data-testid="slot-infra-raptor"]').getAttribute('aria-checked')) === 'true'
  )

  await check('con raptor no hay checkbox: esa nube la aprovisionamos nosotros', async () =>
    (await page.locator('[data-testid="toggle-provisionedInfra"]').count()) === 0
  )

  await page.click('[data-testid="slot-infra-azure"]')
  await check('al elegir una nube del cliente aparece el checkbox', async () => {
    await page.waitForSelector('[data-testid="toggle-provisionedInfra"]', { timeout: 5000 })
    return true
  })

  await page.check('[data-testid="toggle-provisionedInfra"]')
  // el nombre viene precargado en el raíl; el botón arranca la obra de una vez
  await page.click('[data-testid="generate-primary"]')
  await page.waitForSelector('[data-testid="generate-step-generate"]')

  await check('el flag viaja en la petición de generar', async () => body?.['provisionedInfra'] === true)
  await check('la infra que viaja es la elegida (azure)', async () => {
    const slots = body?.['slots'] as Record<string, string> | undefined
    return slots?.['infra'] === 'azure'
  })
  await check('sin errores de consola', async () => errors.length === 0)
  if (errors.length) console.error(errors.join('\n'))

  await browser.close()
  if (failures.length) {
    console.error(`\n✗ ${failures.length} comprobación(es) fallaron`)
    process.exit(1)
  }
  console.log('\n🏅 Infra aprovisionada: checkbox y flag en la petición: OK')
}

void main()

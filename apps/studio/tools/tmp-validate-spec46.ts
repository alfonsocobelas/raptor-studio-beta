/**
 * Validación en vivo de la spec 46 sobre la demo generada con auth (spec46-demo):
 *  - viewer: sin entrada de nav de Expedientes (sin Ver), sin «Nuevo» en Facturas y
 *    403 REAL de la API al pedir expedientes.
 *  - user: ve Facturas con «Nuevo», pero SIN el botón de la transición «Aprobar» (solo admin).
 *  - admin: ve el botón «Aprobar» en la ficha.
 *
 *   npx tsx validate-spec46.ts   (con api en 3000 y web en 4321)
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env['BASE_URL'] ?? 'http://localhost:4321'
const SHOTS = process.env['SHOTS_DIR'] ?? '.'

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function login(page: Page, email: string): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByLabel(/email|correo/i).fill(email)
  await page.getByLabel(/contraseña|password/i).fill('password123')
  await page.getByRole('button', { name: /acceder|entrar|login/i }).click()
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 15000 })
}

async function logout(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
  })
}

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(15000)

  // ── viewer ──────────────────────────────────────────────────────────────
  await login(page, 'viewer@app.local')
  await page.waitForSelector('nav a')

  const navTexts = await page.locator('nav a').allTextContents()
  if (navTexts.some(t => /expedientes/i.test(t))) fail(`viewer ve Expedientes en la nav: ${navTexts.join(' | ')}`)
  if (!navTexts.some(t => /facturas/i.test(t))) fail('viewer no ve Facturas (sí tiene Ver)')
  console.log('✓ viewer: la nav oculta Expedientes y mantiene Facturas')

  await page.goto(`${BASE}/ventas/facturas`, { waitUntil: 'networkidle' })
  const nuevo = await page.getByRole('button', { name: /nueva factura|nuevo/i }).count()
  if (nuevo > 0) fail('viewer ve el botón «Nuevo» en Facturas')
  console.log('✓ viewer: sin botón «Nuevo» en Facturas')

  const status = await page.evaluate(async () => {
    const res = await fetch('/api/v1/expedientes?page=1&pageSize=10')
    return res.status
  })
  if (status !== 403) fail(`la API respondió ${status} a viewer en /expedientes (esperado 403)`)
  console.log('✓ viewer: 403 real de la API en /expedientes')
  await page.screenshot({ path: `${SHOTS}/spec46-viewer-facturas.png` })
  await logout(page)

  // ── user: sin botón de transición (aprobar es solo admin) ───────────────
  await login(page, 'user@app.local')
  await page.goto(`${BASE}/ventas/facturas`, { waitUntil: 'networkidle' })
  const nuevoUser = await page.getByRole('button', { name: /nueva factura|nuevo/i }).count()
  if (nuevoUser === 0) fail('user no ve «Nuevo» en Facturas (sí tiene Gestionar)')

  // crea una factura para tener ficha que visitar
  await page.getByRole('button', { name: /nueva factura|nuevo/i }).first().click()
  await page.getByLabel(/nombre/i).fill('Factura de validación')
  await page.getByRole('button', { name: /crear|guardar/i }).click()
  await page.waitForTimeout(800)
  await page.getByText('Factura de validación').first().waitFor()

  // entra a la ficha por la acción «ver»
  await page.getByRole('button', { name: /ver ficha|ver/i }).first().click()
  await page.waitForURL(/facturas\//)
  const aprobarUser = await page.getByTestId('transition-aprobar').count()
  if (aprobarUser > 0) fail('user ve el botón «Aprobar» (la matriz lo deja solo a admin)')
  console.log('✓ user: crea facturas pero NO ve el botón «Aprobar»')
  await page.screenshot({ path: `${SHOTS}/spec46-user-ficha-sin-aprobar.png` })
  const fichaUrl = page.url()
  await logout(page)

  // ── admin: el botón de la transición está ───────────────────────────────
  await login(page, 'admin@app.local')
  await page.goto(fichaUrl, { waitUntil: 'networkidle' })
  await page.getByTestId('transition-aprobar').waitFor()
  console.log('✓ admin: ve el botón «Aprobar» en la misma ficha')
  await page.screenshot({ path: `${SHOTS}/spec46-admin-ficha-con-aprobar.png` })

  await browser.close()
  console.log('✓ VALIDACIÓN SPEC 46 OK')
}

main().catch(e => fail(String(e)))

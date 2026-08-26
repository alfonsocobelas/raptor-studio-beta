/**
 * Validación EN VIVO de las specs 43 y 46 sobre la app generada por
 * `tools/smoke-machine-access.ts`: máquina de estados y matriz de accesos ejercitadas
 * contra la app de verdad —navegador y API—, no contra el lienzo.
 *
 *   npx tsx tools/validate-emitted-machine-access.ts
 *   BASE_URL / API_URL / SHOTS_DIR opcionales
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env['BASE_URL'] ?? 'http://localhost:4331'
const API = process.env['API_URL'] ?? 'http://localhost:3021/api/v1'
const SHOTS = process.env['SHOTS_DIR']

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function shot(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

async function login(page: Page, email: string): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByLabel(/email|correo/i).fill(email)
  await page.getByLabel(/contraseña|password/i).fill('password123')
  await page.getByRole('button', { name: /acceder|entrar|login/i }).click()
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 20000 })
}

async function logout(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
  })
}

/** Llamada a la API con la sesión del navegador: el 403/409 que se comprueba es el real. */
async function api(page: Page, method: string, path: string): Promise<number> {
  return page.evaluate(async ([m, p]) => (await fetch(`/api/v1${p}`, { method: m })).status, [method, path] as const)
}

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(20000)

  // ── admin: la máquina por HTTP (spec 43) ────────────────────────────────────
  await login(page, 'admin@app.local')
  const ordenes = await page.evaluate(async () => {
    const res = await fetch('/api/v1/ordenes?page=1&pageSize=10')
    return (await res.json()) as { items: { id: string; estado: string }[] }
  })
  const recibidas = ordenes.items.filter(o => o.estado === 'recibida')
  if (recibidas.length < 2) fail(`hacen falta 2 órdenes en «recibida» y hay ${recibidas.length}`)
  const [ciclo, ficha] = recibidas

  if ((await api(page, 'POST', `/ordenes/${ciclo.id}/aprobar`)) !== 409) fail('la transición ilegal no dio 409')
  console.log('✓ spec 43: «aprobar» desde «recibida» → 409')
  if ((await api(page, 'POST', `/ordenes/${ciclo.id}/presupuestar`)) !== 204) fail('la transición legal no dio 204')
  if ((await api(page, 'POST', `/ordenes/${ciclo.id}/presupuestar`)) !== 204) fail('re-aplicar no dio 204 no-op')
  console.log('✓ spec 43: «presupuestar» → 204 y re-aplicarla → 204 no-op')
  if ((await api(page, 'POST', `/ordenes/${ciclo.id}/aprobar`)) !== 204)
    fail('«aprobar» desde «presupuestada» no dio 204')
  if ((await api(page, 'POST', '/ordenes/00000000-0000-7000-8000-000000000000/aprobar')) !== 404) {
    fail('una orden inexistente no dio 404')
  }
  console.log('✓ spec 43: la orden inexistente → 404')

  // ── admin: los botones aparecen y desaparecen con el estado (spec 43) ───────
  await page.goto(`${BASE}/accesos/ordenes/${ficha.id}`, { waitUntil: 'networkidle' })
  await page.getByTestId('transition-presupuestar').waitFor()
  if (await page.getByTestId('transition-aprobar').count()) fail('«Aprobar» se ofrece desde «recibida»')
  await shot(page, 'spec43-4-ficha-recibida')
  await page.getByTestId('transition-presupuestar').click()
  await page.getByTestId('transition-aprobar').waitFor()
  if (await page.getByTestId('transition-presupuestar').count()) fail('«Presupuestar» sigue tras presupuestar')
  await shot(page, 'spec43-5-ficha-presupuestada')
  console.log('✓ spec 43: al presupuestar desaparece su botón y aparecen los del estado nuevo')

  // el botón restringido SÍ está para admin
  await page.goto(`${BASE}/accesos/ordenes/${ciclo.id}`, { waitUntil: 'networkidle' })
  await page.getByTestId('transition-terminar').waitFor()
  await shot(page, 'spec46-3-admin-con-botones')
  await logout(page)

  // ── viewer: sin Recambios en ninguna parte (spec 46) ────────────────────────
  await login(page, 'viewer@app.local')
  await page.waitForSelector('nav a')
  const nav = await page.locator('nav a').allTextContents()
  if (nav.some(t => /recambio/i.test(t))) fail(`Consulta ve Recambios en la nav: ${nav.join(' | ')}`)
  if (!nav.some(t => /[oó]rden/i.test(t))) fail(`Consulta no ve Órdenes, que sí puede ver: ${nav.join(' | ')}`)
  console.log('✓ spec 46: la nav de Consulta esconde Recambios y mantiene Órdenes')

  if ((await api(page, 'GET', '/recambios?page=1&pageSize=10')) !== 403)
    fail('la API no dio 403 a Consulta en recambios')
  console.log('✓ spec 46: 403 real de la API en /recambios')

  await page.goto(`${BASE}/accesos/ordenes`, { waitUntil: 'networkidle' })
  if (await page.getByRole('button', { name: /nueva orden|nuevo/i }).count()) fail('Consulta ve el botón de alta')
  await shot(page, 'spec46-4-viewer-sin-alta')
  await page.goto(`${BASE}/accesos/ordenes/${ciclo.id}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  if (await page.locator('[data-testid^="transition-"]').count()) fail('Consulta ve botones de transición')
  console.log('✓ spec 46: Consulta no ve alta ni transiciones')
  await logout(page)

  // ── user: solo sus transiciones (spec 46) ───────────────────────────────────
  await login(page, 'user@app.local')
  await page.goto(`${BASE}/accesos/ordenes/${ciclo.id}`, { waitUntil: 'networkidle' })
  await page.getByTestId('transition-terminar').waitFor()
  if (await page.getByTestId('transition-facturar').count()) fail('Usuario ve «Facturar», retirada en el estudio')
  await shot(page, 'spec46-5-user-solo-lo-suyo')
  console.log('✓ spec 46: Usuario ve «Terminar» y no «Facturar»')

  await page.goto(`${BASE}/accesos/ordenes/${ficha.id}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  if (await page.getByTestId('transition-aprobar').count()) fail('Usuario ve «Aprobar», que es solo de admin')
  console.log('✓ spec 46: Usuario no ve «Aprobar» en la ficha donde admin sí la veía')
  if ((await api(page, 'POST', `/ordenes/${ficha.id}/aprobar`)) !== 403) fail('la API dejó a Usuario aprobar')
  console.log('✓ spec 46: 403 real de la API cuando Usuario intenta aprobar')

  await browser.close()
  console.log('✓ VALIDACIÓN EN VIVO 43 + 46 OK')
}

void main()

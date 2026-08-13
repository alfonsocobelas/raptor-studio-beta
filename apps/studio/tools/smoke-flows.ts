/**
 * Smoke de la pantalla de FLUJOS. Siembra un diseño con un proceso ramificado por el
 * REST del historial, lo abre en el lienzo y comprueba lo que las pruebas unitarias no
 * ven: que las acciones seguidas se dibujan como UNA tarjeta y —lo que motivó el lavado
 * de cara— que borrar una acción no descoloca ningún bloque.
 *
 * Ya cazó un fallo real: `sizeOf` devolvía la caja entera y su x/y pisaba la posición
 * del hueco, así que las tarjetas se iban a 7500px del origen con el lienzo en verde.
 *
 *   npx tsx tools/smoke-flows.ts   (con `npm run web` y `npm run studio:api` corriendo)
 *   SHOTS_DIR opcional para dejar capturas
 */
import { chromium, type Page } from 'playwright'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'
const API = process.env['STUDIO_API'] ?? 'http://localhost:3400/api/v1'
const SHOTS = process.env['SHOTS_DIR']
const SLUG = 'smoke-flows'

/** Un proceso con las dos formas que importan: cadena de acciones y ramas de decisión. */
const DESIGN = {
  appName: SLUG,
  resources: [],
  pages: [],
  flows: [
    {
      name: 'Aviso de stock bajo',
      nodes: [
        { id: 'disparador', kind: 'start', text: 'Cambia el stock' },
        { id: 'bajo', kind: 'decision', text: 'stock < 10' },
        { id: 'marcar', kind: 'step', text: 'Marcar la fila en naranja' },
        { id: 'correo', kind: 'step', text: 'Enviar correo' },
        { id: 'cerrar', kind: 'step', text: 'Cerrar el aviso' },
        { id: 'quitar', kind: 'step', text: 'Quitar el aviso' },
        { id: 'listo', kind: 'end', text: 'Listo' }
      ],
      edges: [
        { from: 'disparador', to: 'bajo' },
        { from: 'bajo', to: 'marcar', label: 'sí' },
        { from: 'marcar', to: 'correo' },
        { from: 'correo', to: 'cerrar' },
        { from: 'cerrar', to: 'listo' },
        { from: 'bajo', to: 'quitar', label: 'no' },
        { from: 'quitar', to: 'listo' }
      ]
    }
  ]
}

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function shot(page: Page, name: string): Promise<void> {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

/** Posición de cada BLOQUE del lienzo (tarjeta o píldora), tal como la pinta el navegador. */
async function positions(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {}
    for (const el of document.querySelectorAll('[data-testid^="flow-card-"], [data-testid^="flow-node-"]')) {
      const id = el.getAttribute('data-testid') as string
      if (id.includes('-branch-') || id.includes('-add-') || id.includes('-kind-')) continue
      const style = (el as HTMLElement).style
      if (style.left) out[id] = `${style.left},${style.top}`
    }
    return out
  })
}

async function main(): Promise<void> {
  const seeded = await fetch(`${API}/studio/designs/${SLUG}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(DESIGN)
  })
  if (!seeded.ok) fail(`no se pudo sembrar el diseño (${seeded.status}): ¿está corriendo el studio-api?`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
  page.setDefaultTimeout(20000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto(WEB, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(slug => localStorage.setItem('studio.activeDesign', slug), SLUG)
  await page.reload({ waitUntil: 'networkidle' })

  await page.getByTestId('mode-flows').click()
  await page.getByTestId('flow-viewport').waitFor()
  await page.getByTestId('flow-card-marcar').waitFor()
  await shot(page, 'smoke-flows-1-tarjetas')

  // las dos acciones seguidas son la MISMA tarjeta, y la de la otra rama es otra
  for (const id of ['flow-step-marcar', 'flow-step-correo', 'flow-card-quitar']) {
    if (!(await page.getByTestId(id).count())) fail(`falta ${id} en el lienzo`)
  }
  // la cabecera dice QUÉ es, no de qué rama cuelga: la rama ya la dice la flecha que entra
  const cabecera = await page.getByTestId('flow-card-branch-marcar').textContent()
  if (cabecera?.trim() !== 'acciones') fail(`la cabecera de la tarjeta dice «${cabecera?.trim()}»`)
  // la flecha interna de la tarjeta no se dibuja
  if (await page.getByTestId('flow-edge-marcar-correo').count()) fail('la flecha interna de la tarjeta se dibuja')

  // ARRASTRAR UNA FILA (spec 40): el gesto real, que vitest no ve —jsdom no tiene layout—.
  // La tercera acción se sube a la primera fila y la tarjeta se renumera.
  const asa = page.getByTestId('flow-step-grip-cerrar')
  await page.getByTestId('flow-step-cerrar').hover()
  const caja = await asa.boundingBox()
  if (!caja) fail('la fila no tiene asa de arrastre')
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  await page.mouse.down()
  await page.mouse.move(caja.x + caja.width / 2, caja.y - 100, { steps: 10 })
  await shot(page, 'smoke-flows-2-arrastrando-fila')
  if (!(await page.getByTestId('flow-step-drop-guide').count())) fail('no se pinta la guía de dónde cae la fila')
  await page.mouse.up()

  const orden = await page
    .locator('[data-testid="flow-card-cerrar"] [data-testid^="flow-step-number-"]')
    .evaluateAll(nodes => nodes.map(node => `${node.getAttribute('data-testid')}=${node.textContent?.trim()}`))
  if (orden.join() !== 'flow-step-number-cerrar=1,flow-step-number-marcar=2,flow-step-number-correo=3') {
    fail(`la fila no subió de puesto: ${orden.join(' · ')}`)
  }
  await shot(page, 'smoke-flows-3-fila-reordenada')

  // el lienzo no se descoloca al editar: NADIE cambia de sitio al borrar una acción
  const antes = await positions(page)
  await page.getByTestId('flow-step-correo').hover()
  await page.getByTestId('flow-step-remove-correo').click({ force: true })
  await page.getByTestId('flow-step-correo').waitFor({ state: 'detached' })
  const despues = await positions(page)
  await shot(page, 'smoke-flows-4-tras-borrar')

  const movidos = Object.keys(despues).filter(id => antes[id] && antes[id] !== despues[id])
  if (movidos.length) fail(`borrar una acción movió ${movidos.length} bloque(s): ${movidos.join(', ')}`)

  // «+ Acción» devuelve la fila a la tarjeta
  await page.getByTestId('flow-card-add-cerrar').click()
  await page.getByTestId('flow-node-text-input').waitFor()

  if (errors.length) fail(`errores en consola: ${errors.join(' | ')}`)
  await browser.close()

  await fetch(`${API}/studio/designs/${SLUG}`, { method: 'DELETE' })
  console.log('✓ flujos: tarjetas de acciones, sin flechas internas, y borrar no descoloca nada')
}

void main()

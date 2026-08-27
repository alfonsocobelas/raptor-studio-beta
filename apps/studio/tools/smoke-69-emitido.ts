/**
 * Smoke de la ANATOMÍA sobre la app CONSTRUIDA (spec 69, segunda revisión de Alfonso: «los
 * componentes siguen siendo muy parecidos… viene a ser lo mismo»).
 *
 * Por qué no basta el lienzo: el mock del estudio escribe su propio `<label>`/`<input>` en vez de
 * pasar por `app-form-field` y `[appinput]`, así que ahí no se puede medir lo que de verdad
 * distingue una línea de diseño — dónde se sienta la etiqueta, si el campo es caja o subrayado, si
 * el estado es píldora o punto. Aquí se mide sobre el CSS que construye Tailwind de verdad.
 *
 * Sin backend ni base de datos: el dist se sirve estático desde este mismo proceso y el API se
 * simula en el navegador con `page.route` (patrón de la verificación de la spec 67).
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-69-emitido.ts <dist> <piel>
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { chromium, type Page } from 'playwright'

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
}

/** Servidor estático con vuelta a index.html: el router de Angular resuelve el resto. */
function serve(root: string, port: number): Server {
  const server = createServer((req, res) => {
    const requested = decodeURIComponent((req.url ?? '/').split('?')[0])
    const candidate = join(root, normalize(requested))
    const file = existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(root, 'index.html')
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  server.listen(port)
  return server
}

const CUSTOMERS = [
  {
    name: 'Marta Ibáñez Ruiz',
    status: 'ACTIVE',
    customerType: 'DIRECT',
    industry: 'Seguros',
    taxId: 'B12345678',
    city: 'Valencia',
    country: 'España',
    address: 'Av. del Puerto 42',
    phone: '+34 961 22 33 44'
  },
  {
    name: 'Construcciones Vela SL',
    status: 'ACTIVE',
    customerType: 'PARTNER',
    industry: 'Construcción',
    taxId: 'B87654321',
    city: 'Bilbao',
    country: 'España',
    address: 'Gran Vía 8',
    phone: '+34 944 11 22 33'
  },
  {
    name: 'Luis Ferrán Oliva',
    status: 'INACTIVE',
    customerType: 'DIRECT',
    industry: 'Peritaje',
    taxId: 'A11223344',
    city: 'Sevilla',
    country: 'España',
    address: 'C/ Betis 15',
    phone: '+34 954 55 66 77'
  },
  {
    name: 'Comunidad Sierra 14',
    status: 'ACTIVE',
    customerType: 'DIRECT',
    industry: 'Inmobiliaria',
    taxId: 'H55667788',
    city: 'Madrid',
    country: 'España',
    address: 'C/ Sierra 14',
    phone: '+34 913 44 55 66'
  },
  {
    name: 'Hotel Ribera SA',
    status: 'ACTIVE',
    customerType: 'PARTNER',
    industry: 'Hostelería',
    taxId: 'A99887766',
    city: 'Zaragoza',
    country: 'España',
    address: 'Paseo Ribera 3',
    phone: '+34 976 33 44 55'
  }
]

/** El API que necesita la pantalla, simulada en el navegador. */
async function mockApi(page: Page): Promise<void> {
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

  // OJO al orden: Playwright aplica las rutas en orden INVERSO al registro, así que el comodín
  // va PRIMERO o taparía a las específicas (con él delante, el listado salía vacío).
  await page.route('**/api/v1/**', route =>
    route.fulfill(json({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }))
  )
  await page.route('**/api/v1/customers**', route =>
    route.fulfill(
      json({
        items: CUSTOMERS.map((customer, index) => ({ id: `c-${index}`, ...customer })),
        total: 148,
        page: 1,
        pageSize: 20,
        totalPages: 8
      })
    )
  )
  await page.route('**/api/v1/auth/me', route =>
    route.fulfill(json({ id: 'u-1', email: 'admin@app.local', name: 'Admin Local', role: 'admin' }))
  )
}

async function main(): Promise<void> {
  const [dist, skin] = process.argv.slice(2)
  if (!dist || !skin) throw new Error('uso: smoke-69-emitido.ts <dist> <piel>')

  const port = 4700 + (skin.charCodeAt(0) % 90)
  const server = serve(dist, port)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))
  await mockApi(page)

  // la ruta la fija el contexto del modelo de oro: /sap-licensing/customers
  await page.goto(`http://localhost:${port}/sap-licensing/customers`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('table tbody tr', { timeout: 30000 })
  await page.screenshot({ path: `../../docs/style/smoke-69-emitido-${skin}-listado.png`, fullPage: false })

  const read = async (selector: string, property: string): Promise<string> =>
    page.evaluate(
      ([s, p]) => {
        const node = document.querySelector(s)
        return node ? getComputedStyle(node).getPropertyValue(p).trim() : '—'
      },
      [selector, property]
    )

  const measures: Record<string, string> = {
    'celda · alto': await read('table tbody td', 'padding-top'),
    'cabecera · versalita': await read('table th', 'text-transform'),
    'icono · trazo': await read('table tbody button ng-icon svg', 'stroke-width'),
    'toolbar · botón': await read('button.border, button[appbtn].border', 'border-bottom-width')
  }

  // el formulario, donde vive la mitad de la anatomía
  // el botón de alta del DataTable no lleva testid: se pulsa por su texto
  await page
    .locator('button', { hasText: /Nuevo|Crear|Añadir/ })
    .first()
    .click({ timeout: 5000 })
    .catch(() => undefined)
  await page.waitForTimeout(600)
  const dialog = await page.locator('app-dialog').count()
  if (dialog) {
    Object.assign(measures, {
      'campo · display': await read('app-form-field hlm-field', 'display'),
      'campo · rejilla': await read('app-form-field hlm-field', 'grid-template-columns'),
      'campo · borde sup.': await read('input[appinput]', 'border-top-width'),
      'campo · borde inf.': await read('input[appinput]', 'border-bottom-width'),
      'etiqueta · versalita': await read('app-form-field label', 'text-transform'),
      'etiqueta · alineación': await read('app-form-field label', 'text-align'),
      'diálogo · radio': await read('app-dialog .app-float', 'border-radius')
    })
    await page.screenshot({ path: `../../docs/style/smoke-69-emitido-${skin}-formulario.png` })
  }

  console.log(`\n── ${skin} (app construida) ──`)
  for (const [key, value] of Object.entries(measures)) console.log(`${key.padEnd(24)} ${value}`)
  if (errors.length) console.log(`\n⚠️ errores de consola:\n${errors.slice(0, 3).join('\n')}`)

  await browser.close()
  server.close()
  console.log(JSON.stringify({ skin, measures }))
}

main()

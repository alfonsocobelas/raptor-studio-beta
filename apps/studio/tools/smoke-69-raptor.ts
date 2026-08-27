/**
 * Smoke de la familia raptor (spec 69): el tema de la casa y las tres pieles nuevas, medidos
 * sobre el lienzo del estudio, que desde la spec 68 inyecta el CSS REAL del preset.
 *
 * Lo que se comprueba, piel a piel y con `getComputedStyle` sobre lo pintado:
 *   - el tema «raptor» pone el papel cálido y el naranja de la casa en el foco
 *   - cada piel cambia forma, densidad y cromo (y no sólo el color)
 *   - los tokens derivados con `color-mix` RESUELVEN — si el color-mix quedara inválido, la
 *     superficie caería a transparente y aquí se vería (es la trampa de la spec 67)
 *   - ninguna piel pinta un naranja escrito a mano: con otro tema, el acento es el de ese tema
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-69-raptor.ts
 *   (con `npm run web` corriendo)
 */
import { chromium, type Page } from 'playwright'

const WEB = process.env['STUDIO_WEB'] ?? 'http://localhost:4316'
const SHOTS = process.env['SHOTS'] ?? '../../docs/style'
const SKINS = ['actual', 'cabina', 'taller', 'banco', 'rotulo', 'suite'] as const

/** Lo medido de una piel: forma, densidad y cromo, no colores sueltos. */
interface Measures {
  panelRadius: string
  kpiRadius: string
  kpiShadow: string
  kpiGap: string
  kpiStripRule: string
  dialogBg: string
  dialogRadius: string
  labelSize: string
  panelShadow: string
  metricSize: string
  cellSize: string
  thTransform: string
  thBackground: string
  badgeRadius: string
  ctaBackground: string
  shell: 'rail' | 'banner'
}

async function measure(page: Page): Promise<Measures> {
  return page.evaluate(() => {
    // el ámbito se pega a CADA parte de la lista: con `.preview-scope a, b` sólo la primera
    // queda acotada y el resto caza en el chrome del estudio (se medía un botón de la barra)
    const read = (selector: string, property: string): string => {
      const scoped = selector
        .split(',')
        .map(part => `.preview-scope ${part.trim()}`)
        .join(', ')
      const node = document.querySelector(scoped)
      return node ? getComputedStyle(node).getPropertyValue(property).trim() : '—'
    }
    return {
      // el panel de PANTALLA, no la celda de KPI: desde que banco funde la tira, `.app-panel` a
      // secas cazaba la celda y se medía otra cosa
      panelRadius: read('.app-panel:not(:has(.app-metric))', 'border-radius'),
      // la tira de KPIs: ¿cajas o líneas? La celda sin caja, el hueco cerrado y la regla de la tira
      kpiRadius: read('app-kpi-card .app-panel', 'border-radius'),
      kpiShadow: read('app-kpi-card .app-panel', 'box-shadow'),
      kpiGap: read('div.grid:has(> app-kpi-card)', 'gap'),
      kpiStripRule: read('div.grid:has(> app-kpi-card)', 'border-top-width'),
      dialogBg: read('[data-testid="form-dialog"] .app-panel', 'background-color'),
      dialogRadius: read('[data-testid="form-dialog"] .app-panel', 'border-radius'),
      labelSize: read('[data-testid="form-dialog"] .app-label', 'font-size'),
      panelShadow: read('.app-panel:not(:has(.app-metric))', 'box-shadow'),
      metricSize: read('.app-metric', 'font-size'),
      cellSize: read('table td', 'font-size'),
      thTransform: read('table th', 'text-transform'),
      thBackground: read('table th', 'background-color'),
      badgeRadius: read('[appbadge], [hlmbadge]', 'border-radius'),
      ctaBackground: read('[appbtn].bg-primary, [hlmbtn].bg-primary, button.bg-primary', 'background-color'),
      shell: document.querySelector('[data-testid="mock-banner"]') ? 'banner' : 'rail'
    }
  })
}

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

  // una vista «Panel»: métricas arriba y listado debajo — ejercita KPI, tabla, toolbar y chips
  await page.getByTestId('tool-new-view').click()
  await page.getByTestId('preset-panel').click()
  await page.getByTestId('new-page-title').fill('Expedientes')
  await page.getByTestId('new-page-ok').click()
  await page.waitForSelector('.preview-scope .app-metric', { timeout: 30000 })

  // el panel derecho tiene pestañas: las paletas viven en «Tema» y las pieles en «Piel»
  const openTab = async (tab: 'theme' | 'skin'): Promise<void> => {
    await page.getByTestId(`panel-tab-${tab}`).click()
    await page.waitForTimeout(150)
  }

  await openTab('skin')
  await check('el selector ofrece las tres pieles nuevas', async () => {
    for (const skin of ['taller', 'banco', 'rotulo']) {
      if ((await page.getByTestId(`preview-preset-${skin}`).count()) === 0) return false
    }
    return true
  })

  await openTab('theme')
  await check(
    'el catálogo de temas ofrece «raptor»',
    async () => (await page.getByTestId('palette-raptor').count()) > 0
  )

  // el tema de la casa, para todas las medidas siguientes
  await page.getByTestId('palette-raptor').click()
  await page.waitForTimeout(300)

  await check('el tema raptor pinta el papel cálido, no blanco ni gris neutro', async () => {
    const paper = await page.evaluate(() => {
      const scope = document.querySelector('.preview-scope')
      return scope ? getComputedStyle(scope).getPropertyValue('--background').trim() : ''
    })
    console.log(`   papel: ${paper}`)
    return paper.startsWith('oklch(0.985 0.003 85')
  })

  await check('el foco del tema raptor es el naranja de la casa', async () => {
    const ring = await page.evaluate(() => {
      const scope = document.querySelector('.preview-scope')
      return scope ? getComputedStyle(scope).getPropertyValue('--ring').trim() : ''
    })
    console.log(`   foco: ${ring}`)
    return ring.startsWith('oklch(0.656 0.197 32')
  })

  const table: Record<string, Measures> = {}
  await openTab('skin')
  for (const skin of SKINS) {
    await page.getByTestId(`preview-preset-${skin}`).click()
    await page.waitForTimeout(250)
    await page.screenshot({ path: `${SHOTS}/smoke-69-${skin}.png` })

    // el diálogo de alta se ABRE para medirlo: es una superficie con hooks propios y en cabina
    // salía transparente (el .app-panel del preset alcanza al app-dialog). Se cierra pulsando
    // el velo, no con Escape: el mock del lienzo no lo escucha.
    await page
      .locator('.preview-scope [data-testid="table-create"]')
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined)
    await page.waitForTimeout(350)
    table[skin] = await measure(page)
    if (skin === 'taller') await page.screenshot({ path: `${SHOTS}/smoke-69-dialogo-taller.png` })
    await page
      .locator('[data-testid="form-dialog"]')
      .click({ position: { x: 5, y: 5 } })
      .catch(() => undefined)
    await page.waitForTimeout(200)
  }

  console.log('\n── medidas (tema raptor) ──')
  console.table(table)

  await check('cada piel de la familia cambia la FORMA, no sólo el color', async () => {
    const distinct = new Set(
      SKINS.map(skin => `${table[skin].panelRadius}|${table[skin].metricSize}|${table[skin].cellSize}`)
    )
    return distinct.size === SKINS.length
  })

  await check('taller y banco derivan su cabecera del tema: la banda de banco resuelve', async () => {
    // si el color-mix quedara inválido, el fondo caería a transparente (rgba(0, 0, 0, 0))
    return table['banco'].thBackground !== 'rgba(0, 0, 0, 0)' && table['banco'].thTransform === 'uppercase'
  })

  await check('banco funde el panel: sin sombra y con su borde devuelto', async () => {
    return table['banco'].panelShadow === 'none' && table['banco'].panelRadius === '6px'
  })

  await check('taller conserva el relieve de la tarjeta KPI: es la piel cómoda', async () => {
    // el relieve vive en la TARJETA (la del panel de pantalla lo pone la plantilla, no la piel)
    return table['taller'].kpiShadow !== 'none' && table['taller'].kpiRadius === '14px'
  })

  await check('rotulo lleva la navegación en una banda y la cifra más grande de la FAMILIA', async () => {
    // no la más grande de todas: el contador de cabina es mayor a propósito (instrumentación)
    const family = ['taller', 'banco', 'rotulo'].map(skin => parseFloat(table[skin].metricSize))
    return table['rotulo'].shell === 'banner' && Math.max(...family) === parseFloat(table['rotulo'].metricSize)
  })

  await check('sólo rotulo se lleva el CTA al acento', async () => {
    const cta = table['rotulo'].ctaBackground
    console.log(`   CTA rotulo: ${cta} · taller: ${table['taller'].ctaBackground}`)
    return cta !== table['taller'].ctaBackground
  })

  // ── Lo que se escapó en la primera vuelta (revisión de Alfonso, 2026-08-27): los componentes
  // que ninguna piel alcanzaba. Estas dos comprobaciones son las que lo impiden en adelante.
  await check('ninguna piel deja el diálogo sin papel', async () => {
    for (const skin of SKINS) {
      // transparente = el formulario flotando sobre el velo negro (defecto vivo de cabina)
      if (table[skin].dialogBg === 'rgba(0, 0, 0, 0)' || table[skin].dialogBg === '—') {
        console.log(`   ${skin}: ${table[skin].dialogBg}`)
        return false
      }
    }
    return true
  })

  await check('la etiqueta de campo cambia con la piel, no es 14px en todas', async () => {
    const sizes = SKINS.map(skin => table[skin].labelSize)
    console.log(`   etiquetas: ${sizes.join(' · ')}`)
    return new Set(sizes).size >= 4 && !sizes.includes('—')
  })

  await check('banco funde los KPIs en una tira: líneas, no cajas', async () => {
    const b = table['banco']
    const t = table['taller']
    console.log(`   banco → hueco ${b.kpiGap}, celda ${b.kpiRadius}, regla ${b.kpiStripRule}`)
    console.log(`   taller → hueco ${t.kpiGap}, celda ${t.kpiRadius}, regla ${t.kpiStripRule}`)
    // la tira: hueco cerrado, celda sin caja y regla arriba. El resto de las pieles, cajas con aire.
    return (
      b.kpiGap.startsWith('0px') &&
      b.kpiRadius === '0px' &&
      b.kpiStripRule === '1px' &&
      !t.kpiGap.startsWith('0px') &&
      t.kpiRadius !== '0px'
    )
  })

  await check('sin errores de consola', async () => errors.length === 0)
  if (errors.length) console.log(errors.join('\n'))

  await browser.close()
  console.log(failures.length ? `\n❌ ${failures.length} fallo(s)` : '\n✅ smoke 69 completo')
  process.exit(failures.length ? 1 : 0)
}

main()

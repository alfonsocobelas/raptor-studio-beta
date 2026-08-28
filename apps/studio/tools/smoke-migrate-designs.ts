/**
 * Smoke frío de la spec 73: TODOS los diseños guardados en .studio/designs migran a filas con
 * celdas (`normalizeDesignPages`) y su app-schema sigue pasando el gate (`defineApp`). Es la
 * comprobación de que la unificación no rompe ningún diseño real ya dibujado.
 *
 *   ./node_modules/.bin/ts-node -T -r tsconfig-paths/register tools/smoke-migrate-designs.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineApp } from '@raptor/schema'
import { designPagesToAppPages, normalizeDesignPages, type DesignPage } from '@app/shared/domain'

const dir = join(__dirname, '..', '..', '..', '.studio', 'designs')
let failures = 0

for (const file of readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const design = JSON.parse(readFileSync(join(dir, file), 'utf-8')) as { appName: string; pages?: DesignPage[] }
  try {
    const pages = normalizeDesignPages(design.pages ?? [])
    const legacy = JSON.stringify(pages).match(/"kind":"(kpi|top-n|count-by|series)"/)
    if (legacy) throw new Error(`quedó un bloque suelto sin migrar: ${legacy[1]}`)
    const appPages = designPagesToAppPages(pages)
    if (appPages.length) defineApp({ schemaVersion: 1, name: design.appName || 'smoke', pages: appPages })
    const rows = pages.flatMap(p => p.blocks.filter(b => b.kind === 'kpis'))
    const cells = rows.reduce((sum, row) => sum + (row.items?.length ?? 0), 0)
    console.log(`✅ ${file}: ${pages.length} vistas, ${rows.length} filas de KPIs, ${cells} celdas, gate OK`)
  } catch (e) {
    failures++
    console.log(`❌ ${file}: ${e instanceof Error ? e.message : e}`)
  }
}

process.exit(failures)

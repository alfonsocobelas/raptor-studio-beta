/**
 * Sincroniza las vistas de sistema del estudio (spec 57) desde su fuente de verdad: los
 * assets del plugin de auth del generador. Mismo contrato que tools/emit-slots.ts del
 * monorepo — si el asset cambia y esto no se re-ejecuta, un test de paridad se pone rojo.
 *
 *   npm run system-preview   (desde apps/studio)
 *
 * Solo se reescriben RUTAS de import (los servicios reales pasan a ser los dobles del
 * preview; las rutas relativas se ajustan a la profundidad del estudio). El código de los
 * componentes viaja intacto: lo que el lienzo enseña ES lo que el generador emite.
 */
import { readFileSync, writeFileSync } from 'fs'
import * as path from 'path'

const ASSETS = path.join(
  __dirname,
  '../../../libs/generators/src/generators/app/plugins/assets-auth/libs/frontend/src/domains'
)
const TARGET = path.join(__dirname, '../libs/frontend/src/domains/studio/design/system-preview')

const SOURCES: { from: string; to: string }[] = [
  { from: 'auth/login.component.ts.template', to: 'login.component.ts' },
  { from: 'iam/users-list.component.ts.template', to: 'users-list.component.ts' },
  { from: 'iam/invite-user-dialog.component.ts.template', to: 'invite-user-dialog.component.ts' },
  { from: 'iam/profile.component.ts.template', to: 'profile.component.ts' },
  { from: 'iam/iam-labels.ts.template', to: 'iam-labels.ts' }
]

// Tabla declarada de reescrituras (nunca regex): de la app emitida al árbol del estudio.
const REWRITES: [string, string][] = [
  ["'../../core/services/auth.service'", "'./preview-auth.service'"],
  ["'../../core/services/user.service'", "'./preview-user.service'"],
  ["'../../shared/components/", "'../../../../shared/components/"],
  ["'../../shared/utils/", "'../../../../shared/utils/"]
]

export function renderSystemPreview(): Map<string, string> {
  const files = new Map<string, string>()
  for (const { from, to } of SOURCES) {
    let source = readFileSync(path.join(ASSETS, from), 'utf-8')
    for (const [before, after] of REWRITES) {
      source = source.split(before).join(after)
    }
    const banner =
      `// GENERADO por apps/studio/tools/emit-system-preview.ts — NO EDITAR (spec 57)\n` +
      `// Fuente: plugins/assets-auth/libs/frontend/src/domains/${from}\n`
    files.set(to, banner + source)
  }
  return files
}

if (require.main === module) {
  for (const [name, content] of renderSystemPreview()) {
    writeFileSync(path.join(TARGET, name), content)
    console.log(`✅ ${name}`)
  }
  console.log('system-preview sincronizado desde los assets del plugin de auth')
}

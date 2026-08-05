import * as fs from 'fs'
import * as path from 'path'

/**
 * Defecto: el vitest emitido solo aliasaba `@app/shared/domain`, así que
 * cualquier spec que tocara un componente con imports de Spartan fallaba al
 * resolver `@spartan-ng/helm/*` — los helm son fuente vendorizada, no un paquete.
 */
describe('vitest de la app emitida', () => {
  const config = fs.readFileSync(
    path.join(__dirname, 'files-skeleton', 'vitest.config.mts.template'),
    'utf-8'
  )

  it('resuelve los alias desde el tsconfig, no con una lista escrita a mano', () => {
    // mantener 16 rutas duplicadas en dos ficheros es la receta para que se
    // desincronicen: se leen del tsconfig, que es donde ya viven
    expect(config).toContain('tsconfig.base.json')
    expect(config).toContain('compilerOptions')
  })

  it('el tsconfig emitido declara el dominio compartido, de donde sale el alias', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'files-skeleton', 'tsconfig.base.json.template'), 'utf-8')
    ) as { compilerOptions: { paths: Record<string, string[]> } }

    expect(tsconfig.compilerOptions.paths['@app/shared/domain']).toBeDefined()
    expect(tsconfig.compilerOptions.paths['@spartan-ng/helm/alert-dialog']).toBeDefined()
  })
})

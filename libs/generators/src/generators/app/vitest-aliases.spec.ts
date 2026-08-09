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

  /**
   * Spec 35: sin el compilador de Angular, vitest pasa los .ts por esbuild, que borra los
   * decoradores sin generar la metadata — cualquier test que RENDERICE un componente muere con
   * NG0303 («columns no es un input»). Medido en una app real: 53 de 65 tests del DataTable.
   */
  it('compila los componentes con el plugin de Angular, apuntado a un tsconfig que ve el frontend', () => {
    expect(config).toContain('@analogjs/vite-plugin-angular')
    // el tsconfig raíz solo incluye backend+shared: si el plugin mira ahí, no compila NADA del
    // frontend y el fallo es idéntico a no tener plugin
    expect(config).toContain('tsconfig.spec.json')
    // los helm viajan como fuente vendorizada: sin inline, el plugin no compila sus plantillas
    expect(config).toContain('inline')
  })

  it('el tsconfig de tests cubre el frontend y sus specs', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'files-skeleton', 'tsconfig.spec.json.template'), 'utf-8')
    ) as { include: string[]; exclude?: string[] }

    expect(tsconfig.include).toContain('libs/frontend/**/*.ts')
    expect(tsconfig.include).toContain('libs/ui/**/*.ts')
    // el tsconfig del app EXCLUYE los .spec: heredarlo sin limpiar la exclusión repite el fallo
    expect(tsconfig.exclude ?? []).toHaveLength(0)
  })

  it('el tsconfig emitido declara el dominio compartido, de donde sale el alias', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'files-skeleton', 'tsconfig.base.json.template'), 'utf-8')
    ) as { compilerOptions: { paths: Record<string, string[]> } }

    expect(tsconfig.compilerOptions.paths['@app/shared/domain']).toBeDefined()
    expect(tsconfig.compilerOptions.paths['@spartan-ng/helm/alert-dialog']).toBeDefined()
  })
})

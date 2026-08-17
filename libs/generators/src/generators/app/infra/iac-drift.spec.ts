import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import * as fs from 'fs'
import * as path from 'path'
import { appGenerator } from '../app'

/**
 * TASK-11 (spec 50): el stack de Terraform vive DOS veces — el canon en `iac/<proveedor>` y
 * la copia que el generador emite dentro de la app. Es la misma duplicación que ya existe
 * entre `libs/infra/config-aws` y `files-infra-aws`, y aquí se cierra con un test en vez de
 * con disciplina: si alguien arregla el canon y olvida la copia (o al revés), esto se pone
 * rojo el mismo día, no el día del despliegue.
 */
describe('iac emitida vs catálogo', () => {
  const repoRoot = path.join(__dirname, '../../../../../..')

  const catalogOf = (provider: string): string => path.join(repoRoot, 'iac', provider)
  const subtreeOf = (files: string): string => path.join(__dirname, '..', files, 'iac')

  /** Sin los artefactos locales de terraform (.terraform, .terraform.lock.hcl): no se versionan. */
  const filesIn = (dir: string): string[] =>
    fs
      .readdirSync(dir)
      .filter(name => !name.startsWith('.'))
      .sort()

  describe.each([
    ['azure', 'files-infra-azure'],
    ['aws', 'files-infra-aws'],
    ['hetzner', 'files-infra-raptor']
  ])('%s', (provider, files) => {
    it('el subárbol del generador contiene exactamente los ficheros del catálogo', () => {
      const catalog = filesIn(catalogOf(provider))
      const emitted = filesIn(subtreeOf(files)).map(name => name.replace(/\.template$/, ''))

      expect(emitted).toEqual(catalog)
    })

    it('cada fichero es idéntico byte a byte al del catálogo', () => {
      for (const name of filesIn(catalogOf(provider))) {
        const canon = fs.readFileSync(path.join(catalogOf(provider), name), 'utf-8')
        const copyPath = path.join(subtreeOf(files), name.endsWith('.tf') ? `${name}.template` : name)

        expect({ name, content: fs.readFileSync(copyPath, 'utf-8') }).toEqual({ name, content: canon })
      }
    })
  })

  /**
   * El nombre del proyecto es lo ÚNICO que el generador toca del stack. En azure no hay
   * variable `project` (nombra recurso a recurso), así que ahí no debe tocar nada — y desde
   * luego no la base de datos, que es la única "acelerador" de su variables.tf.
   */
  it('renombra el proyecto en aws pero no la base de datos de azure', async () => {
    const withAws: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(withAws, { name: 'demo', models: 'contract', skipInstall: true, infra: 'aws' })
    const awsVariables = withAws.read('apps/demo/iac/variables.tf', 'utf-8') ?? ''

    expect(awsVariables).toContain(`variable "project" {
  description = "Short project slug used as naming prefix (e.g. acelerador)."
  type        = string
  default     = "demo"`)
    // el nombre de la base de datos NO es el prefijo de nombres: se queda como estaba
    expect(awsVariables).toContain(`variable "db_name" {
  description = "Name of the application database."
  type        = string
  default     = "acelerador"`)

    const withAzure: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(withAzure, { name: 'demo', models: 'contract', skipInstall: true, infra: 'azure' })
    const azureVariables = withAzure.read('apps/demo/iac/variables.tf', 'utf-8') ?? ''

    expect(azureVariables).toContain('default     = "acelerador"')
    expect(azureVariables).not.toContain('default     = "demo"')
  })
})

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { DEFAULT_PORTS, applyPorts } from './ports'

/**
 * Hallazgo 14: los puertos venían clavados (3000 API, 4321 web, 5433/5434
 * Postgres) y el contenedor se llamaba siempre `app-postgres-local`. Con otro
 * proyecto abierto —o dos demos vivas— chocan y la segunda pisa a la primera.
 */
describe('applyPorts', () => {
  const withApp = (): Tree => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('package.json', JSON.stringify({ scripts: { web: 'ng serve --port 4321' } }, null, 2))
    tree.write(
      'apps/frontend-app/proxy.conf.json',
      JSON.stringify({ '/api': { target: 'http://localhost:3000' } }, null, 2)
    )
    tree.write(
      'libs/backend/src/contexts/shared/infrastructure/config/environments/local.json',
      JSON.stringify({ app: { port: 3000 }, database: { port: 5433 } }, null, 2)
    )
    tree.write(
      'libs/backend/src/contexts/shared/infrastructure/config/environments/test.json',
      JSON.stringify({ app: { port: 3000 }, database: { port: 5434 } }, null, 2)
    )
    tree.write(
      'docker/docker-compose.local.yml',
      "services:\n  postgres:\n    container_name: app-postgres-local\n    ports:\n      - '5433:5432'\n"
    )
    tree.write(
      'docker/docker-compose.test.yml',
      "services:\n  postgres:\n    container_name: app-postgres-test\n    ports:\n      - '5434:5432'\n"
    )
    return tree
  }

  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('sin puertos declarados los valores no cambian: son los que ya se emiten', () => {
    const tree = withApp()
    const before = read(tree, 'package.json')

    applyPorts(tree, '', 'demo', undefined)

    expect(read(tree, 'package.json')).toBe(before)
    expect(read(tree, 'apps/frontend-app/proxy.conf.json')).toContain('localhost:3000')
  })

  it('el nombre del contenedor NO es opcional: siempre lleva el de la app', () => {
    const tree = withApp()

    applyPorts(tree, '', 'demo', undefined)

    expect(read(tree, 'docker/docker-compose.local.yml')).toContain('container_name: demo-postgres-local')
  })

  it('el puerto de la API viaja al config y al proxy del frontend', () => {
    const tree = withApp()

    applyPorts(tree, '', 'demo', { api: 3010 })

    expect(read(tree, 'libs/backend/src/contexts/shared/infrastructure/config/environments/local.json')).toContain(
      '"port": 3010'
    )
    expect(read(tree, 'apps/frontend-app/proxy.conf.json')).toContain('localhost:3010')
  })

  it('el puerto de la web va al script que la arranca', () => {
    const tree = withApp()

    applyPorts(tree, '', 'demo', { web: 4341 })

    expect(read(tree, 'package.json')).toContain('--port 4341')
  })

  it('los puertos de Postgres van al compose y al config de cada entorno', () => {
    const tree = withApp()

    applyPorts(tree, '', 'demo', { postgres: 5443, postgresTest: 5444 })

    expect(read(tree, 'docker/docker-compose.local.yml')).toContain("'5443:5432'")
    expect(read(tree, 'docker/docker-compose.test.yml')).toContain("'5444:5432'")
    expect(read(tree, 'libs/backend/src/contexts/shared/infrastructure/config/environments/local.json')).toContain(
      '"port": 5443'
    )
    expect(read(tree, 'libs/backend/src/contexts/shared/infrastructure/config/environments/test.json')).toContain(
      '"port": 5444'
    )
  })

  it('el contenedor lleva el nombre de la app: dos demos vivas no se pisan la base', () => {
    const tree = withApp()

    applyPorts(tree, '', 'fincaraiz', { postgres: 5443 })

    expect(read(tree, 'docker/docker-compose.local.yml')).toContain('container_name: fincaraiz-postgres-local')
    expect(read(tree, 'docker/docker-compose.test.yml')).toContain('container_name: fincaraiz-postgres-test')
  })

  it('publica los valores por defecto que documenta el README', () => {
    expect(DEFAULT_PORTS).toEqual({ api: 3000, web: 4321, postgres: 5433, postgresTest: 5434 })
  })
})

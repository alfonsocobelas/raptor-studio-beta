import type { Tree } from '@nx/devkit'
import * as path from 'path'

/** Puertos que ocupa una app generada al ejecutarse en local. */
export interface AppPorts {
  api?: number
  web?: number
  postgres?: number
  postgresTest?: number
}

/** Lo que se emite si nadie declara nada (los valores históricos del esqueleto). */
export const DEFAULT_PORTS: Required<AppPorts> = {
  api: 3000,
  web: 4321,
  postgres: 5433,
  postgresTest: 5434
}

const CONFIG = 'libs/backend/src/contexts/shared/infrastructure/config/environments'
const PROXY = 'apps/frontend-app/proxy.conf.json'
const COMPOSE_LOCAL = 'docker/docker-compose.local.yml'
const COMPOSE_TEST = 'docker/docker-compose.test.yml'

/**
 * Reescribe los puertos y el nombre del contenedor sobre lo ya emitido
 * (hallazgo 14). El esqueleto se copia literal, sin pasar por EJS, así que los
 * puertos se ajustan después — igual que se hacía con la paleta.
 *
 * Dos motivos para que sean configurables: quien genera suele tener otros
 * proyectos abiertos ocupando 3000 y 4200, y dos demos vivas compartían el
 * contenedor `app-postgres-local`, de modo que la segunda pisaba la base de la
 * primera sin avisar.
 */
export function applyPorts(tree: Tree, root: string, appName: string, ports: AppPorts | undefined): void {
  renameContainers(tree, root, appName)
  if (!ports) return

  const at = (file: string): string => path.join(root, file)

  if (ports.api !== undefined) {
    replace(tree, at(`${CONFIG}/local.json`), `"port": ${DEFAULT_PORTS.api}`, `"port": ${ports.api}`)
    replace(tree, at(`${CONFIG}/test.json`), `"port": ${DEFAULT_PORTS.api}`, `"port": ${ports.api}`)
    replace(tree, at(PROXY), `localhost:${DEFAULT_PORTS.api}`, `localhost:${ports.api}`)
  }
  if (ports.web !== undefined) {
    replace(tree, at('package.json'), `--port ${DEFAULT_PORTS.web}`, `--port ${ports.web}`)
  }
  if (ports.postgres !== undefined) {
    replace(tree, at(COMPOSE_LOCAL), `'${DEFAULT_PORTS.postgres}:5432'`, `'${ports.postgres}:5432'`)
    replace(tree, at(`${CONFIG}/local.json`), `"port": ${DEFAULT_PORTS.postgres}`, `"port": ${ports.postgres}`)
  }
  if (ports.postgresTest !== undefined) {
    replace(tree, at(COMPOSE_TEST), `'${DEFAULT_PORTS.postgresTest}:5432'`, `'${ports.postgresTest}:5432'`)
    replace(tree, at(`${CONFIG}/test.json`), `"port": ${DEFAULT_PORTS.postgresTest}`, `"port": ${ports.postgresTest}`)
  }
}

/**
 * El contenedor lleva el nombre de la app. Con `app-postgres-local` fijo, dos
 * demos vivas comparten volumen y la segunda hereda las tablas de la primera.
 */
function renameContainers(tree: Tree, root: string, appName: string): void {
  replace(tree, path.join(root, COMPOSE_LOCAL), 'container_name: app-postgres-local', `container_name: ${appName}-postgres-local`)
  replace(tree, path.join(root, COMPOSE_TEST), 'container_name: app-postgres-test', `container_name: ${appName}-postgres-test`)
}

/** Sustitución literal sobre un fichero del Tree; si no existe, no hay nada que hacer. */
function replace(tree: Tree, file: string, from: string, to: string): void {
  const content = tree.read(file, 'utf-8')
  if (!content || !content.includes(from)) return
  tree.write(file, content.split(from).join(to))
}

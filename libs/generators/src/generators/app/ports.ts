import type { Tree } from '@nx/devkit'
import * as path from 'path'

/** Puertos que ocupa una app generada al ejecutarse en local. */
export interface AppPorts {
  api?: number
  web?: number
  postgres?: number
  postgresTest?: number
  mongo?: number
  mongoTest?: number
}

/** Lo que se emite si nadie declara nada (los valores históricos del esqueleto). */
export const DEFAULT_PORTS: Required<AppPorts> = {
  api: 3000,
  web: 4321,
  postgres: 5433,
  postgresTest: 5434,
  mongo: 27017,
  mongoTest: 27018
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
  // spec 76: el mismo hallazgo 14 sobre mongo — sin esto dos demos mongo comparten el 27017
  // y un mongod nativo del desarrollador gana el loopback sin avisar (trampa de la spec 06)
  if (ports.mongo !== undefined) {
    replace(tree, at(COMPOSE_LOCAL), `'${DEFAULT_PORTS.mongo}:27017'`, `'${ports.mongo}:27017'`)
    replace(tree, at(`${CONFIG}/local.json`), `localhost:${DEFAULT_PORTS.mongo}/`, `localhost:${ports.mongo}/`)
  }
  if (ports.mongoTest !== undefined) {
    replace(tree, at(COMPOSE_TEST), `'${DEFAULT_PORTS.mongoTest}:27017'`, `'${ports.mongoTest}:27017'`)
    replace(tree, at(`${CONFIG}/test.json`), `localhost:${DEFAULT_PORTS.mongoTest}/`, `localhost:${ports.mongoTest}/`)
  }
}

/**
 * Contenedor Y VOLUMEN llevan el nombre de la app. Renombrar solo el contenedor
 * no basta: con el volumen fijo (`app-postgres-local-data`) la demo nueva arranca
 * con las tablas de la anterior y su tabla de migraciones, así que las migraciones
 * se dan por aplicadas y las semillas fallan contra un esquema que no existe.
 */
function renameContainers(tree: Tree, root: string, appName: string): void {
  for (const [file, suffix] of [
    [COMPOSE_LOCAL, 'local'],
    [COMPOSE_TEST, 'test']
  ] as const) {
    const target = path.join(root, file)
    // el nombre de PROYECTO también: sin él Compose lo deriva del directorio (docker/),
    // dos apps comparten proyecto+servicio y el up de la segunda sustituye a la primera
    replace(tree, target, 'services:', `name: ${appName}-${suffix}\nservices:`)
    replace(tree, target, `container_name: app-postgres-${suffix}`, `container_name: ${appName}-postgres-${suffix}`)
    replace(tree, target, `container_name: app-mongo-${suffix}`, `container_name: ${appName}-mongo-${suffix}`)
    for (const engine of ['postgres', 'mongo']) {
      replace(tree, target, `app-${engine}-${suffix}-data`, `${appName}-${engine}-${suffix}-data`)
    }
  }
}

/** Sustitución literal sobre un fichero del Tree; si no existe, no hay nada que hacer. */
function replace(tree: Tree, file: string, from: string, to: string): void {
  const content = tree.read(file, 'utf-8')
  if (!content || !content.includes(from)) return
  tree.write(file, content.split(from).join(to))
}

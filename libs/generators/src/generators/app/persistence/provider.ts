import type { Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@acc/schema'
import type { DatabaseEngine } from '../database'

/**
 * Manifiesto de un motor de persistencia (spec 23): el proveedor es el DUEÑO de lo que
 * su motor emite. Todo lo que antes era un `if (database === …)` repartido por
 * kernel.ts/resource.ts/app.ts se declara aquí, y esos generadores solo consultan.
 *
 * Los campos opcionales son huecos honestos: lo que un motor todavía no emite se ve
 * como ausencia, no se inventa (mongo los rellena al retomar la spec 06).
 */
export interface PersistenceProvider {
  engine: DatabaseEngine
  /** Subárbol de plantillas del kernel con la config y la persistencia compartida del motor */
  kernelFiles: string
  /**
   * Lo que el motor añade al esqueleto de la app: su docker-compose y el arranque de la
   * suite de integración (arranger + jest.setup). Se copia verbatim, como el esqueleto.
   */
  skeletonFiles?: string
  /** Indicador de @nestjs/terminus con el que el readiness comprueba la base */
  healthIndicator: string
  /** Subárbol de la persistencia POR RECURSO (entidad/schema, mapper, repositorio) */
  resourceFiles?: string
  /** Ídem para los hijos de un agregado con composición */
  compositionFiles?: string
  /** Subárbol del test de integración del repositorio (corre contra la base real del compose) */
  integrationTestFiles?: string
  /**
   * Deja un environment emitido coherente con la base que levanta el compose;
   * sin esto `make local-setup` arrancaría contra una base que no existe.
   */
  alignEnvironment?(tree: Tree, configPath: string, environment: 'local' | 'test'): void
  /** El repositorio concreto que el módulo de test-repositories debe registrar por recurso */
  testRepository?(model: ResourceDefinition): { className: string; importPath: string }
  /**
   * El repositorio concreto que el módulo Nest del recurso enlaza al puerto del dominio.
   * Es el punto de conmutación de motor en runtime: `{ provide: XRepository, useClass: … }`.
   */
  moduleRepository?(model: ResourceDefinition): { className: string; importPath: string }
  /**
   * Bindings extra que necesitan las plantillas del motor (p.ej. el shape del documento
   * Mongoose). Se fusionan con las sustituciones del recurso: así el generador de recursos
   * no tiene que saber qué necesita cada motor.
   */
  resourceSubstitutions?(model: ResourceDefinition): Record<string, unknown>
}

export function definePersistence(provider: PersistenceProvider): PersistenceProvider {
  return provider
}

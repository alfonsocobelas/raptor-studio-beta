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
   * Deja un environment emitido coherente con la base que levanta el compose;
   * sin esto `make local-setup` arrancaría contra una base que no existe.
   */
  alignEnvironment?(tree: Tree, configPath: string, environment: 'local' | 'test'): void
  /** El repositorio concreto que el módulo de test-repositories debe registrar por recurso */
  testRepository?(model: ResourceDefinition): { className: string; importPath: string }
}

export function definePersistence(provider: PersistenceProvider): PersistenceProvider {
  return provider
}

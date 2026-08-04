import { Connection } from 'mongoose'

/**
 * Deja la base limpia entre tests. Vacía las colecciones en vez de dropearlas: dropear
 * se llevaría por delante los índices (incluidos los únicos), y los tests siguientes
 * dejarían de ver las restricciones que precisamente quieren comprobar.
 */
export class MongooseEnvironmentArranger {
  constructor(private readonly connection: Connection) {}

  async arrange(): Promise<void> {
    await this.cleanDatabase()
  }

  async close(): Promise<void> {
    await this.cleanDatabase()
  }

  private async cleanDatabase(): Promise<void> {
    const collections = Object.values(this.connection.collections)

    await Promise.all(collections.map(collection => collection.deleteMany({})))
  }
}

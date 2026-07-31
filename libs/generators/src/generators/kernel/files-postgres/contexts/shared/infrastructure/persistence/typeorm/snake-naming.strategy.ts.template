import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm'

// Replica exacta del algoritmo snakeCase de TypeORM (util/StringUtils) para que los
// nombres generados coincidan con las columnas ya creadas por las migraciones.
function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])([A-Z])([a-z])/g, '$1_$2$3')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
}

// TypeORM 1.0 no trae SnakeNamingStrategy y typeorm-naming-strategies no soporta esta versión.
// Solo hay que sobreescribir columnName: tableName de DefaultNamingStrategy ya respeta el nombre
// explícito de @Entity y snakea el resto, que es justo lo que queremos.
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  override columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
    return snakeCase(embeddedPrefixes.concat(customName || propertyName).join('_'))
  }
}

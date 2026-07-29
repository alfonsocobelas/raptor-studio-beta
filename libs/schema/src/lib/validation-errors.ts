export class SchemaValidationError extends Error {
  constructor(
    readonly resourceName: string,
    readonly problems: string[]
  ) {
    super(`Invalid resource-schema '${resourceName}':\n${problems.map(p => `  - ${p}`).join('\n')}`)
    this.name = 'SchemaValidationError'
  }
}

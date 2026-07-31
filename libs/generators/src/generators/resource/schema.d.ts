export interface ResourceGeneratorSchema {
  /** Overrides the model's shared-domain import alias (the app owns the scope) */
  sharedDomainAlias?: string
  /** Name of a registered resource model (e.g. 'contract') */
  name: string
  /** Output directory; defaults to tmp/generated/<plural> (golden-diff working area) */
  directory?: string
  /** Persistence engine of the emitted app (default postgres) */
  database?: 'postgres' | 'mongo'
}

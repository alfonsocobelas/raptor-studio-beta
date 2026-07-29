export interface ResourceGeneratorSchema {
  /** Name of a registered resource model (e.g. 'contract') */
  name: string
  /** Output directory; defaults to tmp/generated/<plural> (golden-diff working area) */
  directory?: string
}

import { InvalidArgumentError } from '../errors'

export const GLOBAL_SEARCH_MAX_LENGTH = 100

// Free-text search matched against a fixed set of columns (OR semantics). The fields never come
// from the client: each module injects its own searchable-columns allowlist, so `fields` IS the
// allowlist and needs no further validation.
export class GlobalSearch {
  private constructor(
    readonly term: string,
    readonly fields: string[]
  ) {}

  // Returns null for a blank term: searching for nothing means "no search", not an error.
  static create(term: string, fields: string[]): GlobalSearch | null {
    if (!fields.length) {
      throw new InvalidArgumentError('GlobalSearch requires at least one searchable field')
    }

    const trimmed = term.trim()
    if (!trimmed) {
      return null
    }
    if (trimmed.length > GLOBAL_SEARCH_MAX_LENGTH) {
      throw new InvalidArgumentError(`The search term exceeds ${GLOBAL_SEARCH_MAX_LENGTH} characters`)
    }

    return new GlobalSearch(trimmed, fields)
  }
}

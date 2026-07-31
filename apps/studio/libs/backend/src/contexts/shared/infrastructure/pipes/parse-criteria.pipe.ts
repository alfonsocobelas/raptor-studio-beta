import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common'
import { InvalidArgumentError } from '../../domain/errors'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const EMPTY_FILTER = Array<Map<string, string>>()
const EMPTY_ORDER = Array<Map<string, string>>()

@Injectable()
export class ParseCriteriaPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata) {
    const raw = value as Record<string, unknown>
    const { filters, orders, search, page, pageSize, ...rest } = raw

    return {
      ...rest,
      page: page ? Number(page) : DEFAULT_PAGE,
      pageSize: pageSize ? Number(pageSize) : DEFAULT_PAGE_SIZE,
      filters: filters ? this.parseToMaps(filters, ['field', 'operator', 'value'], 'filters') : EMPTY_FILTER,
      orders: orders ? this.parseToMaps(orders, ['orderBy', 'orderType'], 'orders') : EMPTY_ORDER,
      search: this.normalizeSearch(search)
    }
  }

  // A repeated ?search= param arrives as an array (not a string) → dropped, never an error.
  private normalizeSearch(search: unknown): string | undefined {
    if (typeof search !== 'string') {
      return undefined
    }
    const trimmed = search.trim()
    return trimmed || undefined
  }

  private parseToMaps(data: unknown, requiredKeys: string[], errorLabel: string): Map<string, string>[] {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data

      if (!Array.isArray(parsed)) {
        throw new InvalidArgumentError(`Invalid "${errorLabel}" format`)
      }

      return parsed.map((item: Record<string, unknown>) => {
        const map = new Map<string, string>()
        requiredKeys.forEach(key => {
          if (!item[key]) {
            throw new InvalidArgumentError(`Invalid "${errorLabel}" format`)
          }
          map.set(key, String(item[key]))
        })
        return map
      })
    } catch (error) {
      if (error instanceof InvalidArgumentError) {
        throw error
      }
      throw new InvalidArgumentError(`Invalid "${errorLabel}" format`)
    }
  }
}

import { defineResource } from '@acc/schema'
import { draftToResource } from '@app/shared/domain'
import type { DesignPayload } from './chat.types'

/**
 * Gate del diseño: cada entidad debe expandir a un resource-schema válido y
 * todo bloque debe referenciar entidades declaradas. La traducción al
 * app-schema (y su defineApp) ocurre al generar, con lo que sea generable.
 */
export function validateDesign(design: DesignPayload): DesignPayload {
  const clean: DesignPayload = JSON.parse(JSON.stringify(design)) as DesignPayload
  const registry = Object.fromEntries(
    clean.resources.map(r => [r.name, defineResource(draftToResource(r, clean.appName))])
  )
  for (const page of clean.pages) {
    for (const block of page.blocks) {
      const refs = [block.resource, ...(block.resources ?? [])].filter(Boolean) as string[]
      for (const ref of refs) {
        if (!registry[ref]) {
          throw new Error(`La vista «${page.title}» referencia una entidad inexistente: ${ref}`)
        }
      }
    }
  }
  return clean
}

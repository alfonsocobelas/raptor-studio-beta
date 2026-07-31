import { defineApp, defineResource } from '@acc/schema'
import { draftToResource } from '@app/shared/domain'
import { composeApp } from '@acc/generators/src/generators/app/composition'
import type { DesignPayload } from './chat.types'

/**
 * Gate determinista del diseño: cada entidad draft debe expandir a un
 * resource-schema válido (defineResource) y las páginas deben componer contra
 * ESAS entidades (defineApp + composeApp). Lanza si algo no es generable.
 */
export function validateDesign(design: DesignPayload): DesignPayload {
  const clean: DesignPayload = JSON.parse(JSON.stringify(design)) as DesignPayload
  const registry = Object.fromEntries(
    clean.resources.map(r => [r.name, defineResource(draftToResource(r, clean.appName))])
  )
  if (clean.pages.length) {
    const definition = defineApp({ schemaVersion: 1, name: clean.appName, pages: clean.pages })
    composeApp(definition, registry)
  }
  return clean
}

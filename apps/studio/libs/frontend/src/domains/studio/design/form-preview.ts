import type { DraftField, DraftResource } from '@app/shared/domain'

/**
 * Rótulos del diálogo de formulario del lienzo: MISMAS fórmulas que el generador
 * (build-substitutions: createLabel, dialogEditTitle, dialogCreate/EditDescription).
 * Si el generador cambia sus textos, esto debe cambiar con él o el lienzo miente.
 */
export type FormDialogMode = 'create' | 'edit'

/** El vocabulario de controles del generador: lo que emite el diálogo real. */
export type FormControl = 'text' | 'textarea' | 'select' | 'date' | 'time' | 'checkbox' | 'number'

export function formDialogTitle(resource: DraftResource, mode: FormDialogMode): string {
  const lower = resource.labelSingular.toLowerCase()
  if (mode === 'edit') return `Editar ${lower}`
  return `Nuev${resource.gender === 'f' ? 'a' : 'o'} ${lower}`
}

export function formDialogDescription(resource: DraftResource, mode: FormDialogMode): string {
  const feminine = resource.gender === 'f'
  const lower = resource.labelSingular.toLowerCase()
  if (mode === 'edit') return `Modifica los datos ${feminine ? 'de la' : 'del'} ${lower}`
  return `Introduce los datos ${feminine ? 'de la nueva' : 'del nuevo'} ${lower}`
}

export function formControlFor(field: DraftField): FormControl {
  switch (field.type) {
    case 'text':
      return 'textarea'
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'date':
      return 'date'
    case 'time':
      return 'time'
    case 'enum':
    case 'ref':
      return 'select'
    default:
      return 'text'
  }
}

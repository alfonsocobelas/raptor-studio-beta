import type { ComponentFixture } from '@angular/core/testing'

/**
 * Arnés de test del contrato app-select. El desplegable del estudio no es un `<select>`:
 * el disparador es un botón y la lista vive en un overlay del CDK, fuera del fixture. Sin
 * esto cada spec repetiría la misma coreografía de abrir, buscar en el documento y pulsar.
 */

/** Texto que muestra el disparador (la etiqueta del valor elegido, o el placeholder). */
export function selectValueLabel(fixture: ComponentFixture<unknown>, testId: string): string {
  return trigger(fixture, testId).textContent?.trim() ?? ''
}

/** Las etiquetas que ofrece el desplegable, en orden. Lo deja abierto. */
export async function openSelect(fixture: ComponentFixture<unknown>, testId: string): Promise<string[]> {
  trigger(fixture, testId).click()
  fixture.detectChanges()
  await fixture.whenStable()
  return items().map(item => item.textContent?.trim() ?? '')
}

/** Abre el desplegable y elige la opción por su etiqueta. Lanza si no la ofrece. */
export async function chooseInSelect(
  fixture: ComponentFixture<unknown>,
  testId: string,
  label: string
): Promise<void> {
  const offered = await openSelect(fixture, testId)
  const option = items().find(item => item.textContent?.trim() === label)
  if (!option) {
    throw new Error(`El desplegable «${testId}» no ofrece «${label}»; ofrece: ${offered.join(', ')}`)
  }
  option.click()
  fixture.detectChanges()
  await fixture.whenStable()
}

function trigger(fixture: ComponentFixture<unknown>, testId: string): HTMLElement {
  const found = fixture.nativeElement.querySelector(`[data-testid="${testId}"] button`)
  if (!found) throw new Error(`No hay ningún desplegable del estudio con data-testid="${testId}"`)
  return found as HTMLElement
}

function items(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('hlm-select-item')]
}

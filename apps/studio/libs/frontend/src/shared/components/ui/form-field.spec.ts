import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { AppFormField } from './form-field'

/**
 * El host del campo TIENE que ser un bloque. Un elemento personalizado sin `display`
 * es `inline` por defecto, y los márgenes verticales no se aplican a las cajas inline:
 * el `space-y-*` con el que los formularios separan un campo del siguiente quedaría
 * inerte y las etiquetas se pegarían a la caja de arriba (visto en Login, 2026-08-26).
 */
describe('AppFormField', () => {
  @Component({ imports: [AppFormField], template: `<app-form-field label="Email" />` })
  class Host {}

  it('el host es un bloque, para que el space-y del formulario le llegue', () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()

    const field: HTMLElement = fixture.nativeElement.querySelector('app-form-field')
    expect(field.classList.contains('block')).toBe(true)
  })
})

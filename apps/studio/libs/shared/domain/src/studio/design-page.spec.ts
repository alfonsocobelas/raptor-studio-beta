import { describe, expect, it } from 'vitest'
import { generableHere } from './design-page'
import type { DesignPage } from './design-page'

const listado: DesignPage = { title: 'Pacientes', blocks: [] }
const ficha: DesignPage = { title: 'Ficha de paciente', blocks: [], drillDown: true }

describe('generableHere', () => {
  it('una tabla se emite en cualquier vista', () => {
    expect(generableHere(listado, { kind: 'table', resource: 'paciente' })).toBe(true)
  })

  it('los ficheros solo se emiten dentro de la ficha del registro', () => {
    expect(generableHere(ficha, { kind: 'attachments', resource: 'paciente' })).toBe(true)
    expect(generableHere(listado, { kind: 'attachments', resource: 'paciente' })).toBe(false)
  })

  it('lo mismo los datos del registro', () => {
    expect(generableHere(ficha, { kind: 'fields', resource: 'paciente' })).toBe(true)
    expect(generableHere(listado, { kind: 'fields', resource: 'paciente' })).toBe(false)
  })

  it('lo que el generador no emite en ningún sitio, tampoco aquí', () => {
    expect(generableHere(ficha, { kind: 'text', text: 'hola' })).toBe(false)
  })
})

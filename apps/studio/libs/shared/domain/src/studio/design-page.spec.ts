import { describe, expect, it } from 'vitest'
import { duplicateOfEarlierBlock, generableHere } from './design-page'
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

  // spec 48: el bloque formulario nace generable, como la tabla
  it('un formulario se emite en cualquier vista', () => {
    expect(generableHere(listado, { kind: 'form', resource: 'paciente' })).toBe(true)
  })
})

describe('duplicateOfEarlierBlock — el bloque que no aporta nada (spec 52)', () => {
  it('marca la segunda tabla del mismo recurso en la misma vista', () => {
    const page: DesignPage = {
      title: 'Panel',
      blocks: [
        { kind: 'kpis', resources: ['orden'] },
        { kind: 'table', resource: 'orden' },
        { kind: 'table', resource: 'orden' }
      ]
    }

    expect(duplicateOfEarlierBlock(page, 1)).toBe(false)
    expect(duplicateOfEarlierBlock(page, 2)).toBe(true)
  })

  it('no marca la misma tabla en vistas distintas: eso son dos pantallas legítimas', () => {
    const panel: DesignPage = {
      title: 'Panel',
      blocks: [
        { kind: 'kpis', resources: ['orden'] },
        { kind: 'table', resource: 'orden' }
      ]
    }
    const listado: DesignPage = { title: 'Órdenes', blocks: [{ kind: 'table', resource: 'orden' }] }

    expect(duplicateOfEarlierBlock(panel, 1)).toBe(false)
    expect(duplicateOfEarlierBlock(listado, 0)).toBe(false)
  })

  it('tablas de recursos distintos, o bloques de tipo distinto, no se estorban', () => {
    const page: DesignPage = {
      title: 'Panel',
      blocks: [
        { kind: 'table', resource: 'orden' },
        { kind: 'table', resource: 'cliente' },
        { kind: 'cards', resource: 'orden' }
      ]
    }

    expect(duplicateOfEarlierBlock(page, 1)).toBe(false)
    expect(duplicateOfEarlierBlock(page, 2)).toBe(false)
  })

  it('un bloque sin recurso (texto, KPIs) nunca es duplicado', () => {
    const page: DesignPage = {
      title: 'Notas',
      blocks: [
        { kind: 'text', text: 'hola' },
        { kind: 'text', text: 'hola' }
      ]
    }

    expect(duplicateOfEarlierBlock(page, 1)).toBe(false)
  })
})

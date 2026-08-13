import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import type { CatalogCard, CatalogGroup } from './generate-catalog'
import { AddonCardsComponent, ChoiceCardsComponent } from './generate-cards.component'

const card = (over: Partial<CatalogCard>): CatalogCard => ({
  slot: 'infra',
  value: 'azure',
  title: 'Azure',
  hint: 'Key Vault y Blob Storage',
  available: true,
  disabled: false,
  ...over
})

const group: CatalogGroup = {
  slot: 'infra',
  heading: '¿Dónde quieres alojarla?',
  subheading: 'Puedes cambiar de proveedor más adelante.',
  cards: [
    card({ value: 'none', title: 'Sin nube', hint: 'Solo el código' }),
    card({}),
    card({ value: 'aws', title: 'AWS', available: false, disabled: true, reason: 'Próximamente' })
  ]
}

/** Lo elegido en la última pulsación, o null si la tarjeta no dejó pulsarse. */
const chosenBox: { value: string | null } = { value: null }

const mountChoices = (chosen: string, cards = group.cards) => {
  chosenBox.value = null
  const fixture = TestBed.createComponent(ChoiceCardsComponent)
  fixture.componentRef.setInput('group', { ...group, cards })
  fixture.componentRef.setInput('chosen', chosen)
  fixture.componentInstance.choose.subscribe(value => (chosenBox.value = value))
  fixture.detectChanges()
  return fixture
}

const at = (fixture: { nativeElement: HTMLElement }, testid: string): HTMLElement | null =>
  fixture.nativeElement.querySelector(`[data-testid="${testid}"]`)

describe('ChoiceCardsComponent', () => {
  it('escribe el encabezado y la entradilla del catálogo', () => {
    const text = mountChoices('none').nativeElement.textContent

    expect(text).toContain('¿Dónde quieres alojarla?')
    expect(text).toContain('Puedes cambiar de proveedor más adelante.')
  })

  it('pinta una tarjeta por opción, con su título y su pista', () => {
    const fixture = mountChoices('none')

    expect(at(fixture, 'slot-infra-azure')?.textContent).toContain('Azure')
    expect(at(fixture, 'slot-infra-azure')?.textContent).toContain('Key Vault y Blob Storage')
  })

  it('la elegida se marca; las demás no', () => {
    const fixture = mountChoices('azure')

    expect(at(fixture, 'slot-infra-azure')?.getAttribute('aria-checked')).toBe('true')
    expect(at(fixture, 'slot-infra-none')?.getAttribute('aria-checked')).toBe('false')
  })

  it('elegir una disponible avisa al padre con su valor', () => {
    const fixture = mountChoices('none')

    at(fixture, 'slot-infra-azure')?.click()

    expect(chosenBox.value).toBe('azure')
  })

  it('la que aún no existe no se puede elegir', () => {
    const fixture = mountChoices('none')

    at(fixture, 'slot-infra-aws')?.click()

    expect(chosenBox.value).toBeNull()
    expect(at(fixture, 'slot-infra-aws')?.hasAttribute('disabled')).toBe(true)
  })

  it('y lleva su pastilla con la razón, para que se lea por qué', () => {
    const fixture = mountChoices('none')

    expect(at(fixture, 'soon-aws')?.textContent).toContain('Próximamente')
    expect(at(fixture, 'soon-azure')).toBeNull()
  })

  it('una opción real pero incompatible también se apaga, diciendo qué le falta', () => {
    const fixture = mountChoices('none', [
      card({ value: 'single-tenant', disabled: true, reason: 'Requiere Base de datos: PostgreSQL' })
    ])

    expect(at(fixture, 'soon-single-tenant')?.textContent).toContain('Requiere Base de datos: PostgreSQL')
  })
})

const addons: CatalogCard[] = [
  card({ slot: 'plugin', value: 'email', title: 'Correo saliente', hint: 'Avisos' }),
  card({ slot: 'plugin', value: 'redis', title: 'Redis', available: false, disabled: true, reason: 'Próximamente' })
]

const toggledBox: { value: string | null } = { value: null }

const mountAddons = (active: string[]) => {
  toggledBox.value = null
  const fixture = TestBed.createComponent(AddonCardsComponent)
  fixture.componentRef.setInput('cards', addons)
  fixture.componentRef.setInput('active', active)
  fixture.componentInstance.toggle.subscribe(value => (toggledBox.value = value))
  fixture.detectChanges()
  return fixture
}

describe('AddonCardsComponent', () => {
  it('marca los complementos activos', () => {
    const fixture = mountAddons(['email'])

    expect(at(fixture, 'plugin-email')?.getAttribute('aria-checked')).toBe('true')
    expect(at(fixture, 'plugin-redis')?.getAttribute('aria-checked')).toBe('false')
  })

  it('pulsar uno disponible lo alterna en el padre', () => {
    const fixture = mountAddons([])

    at(fixture, 'plugin-email')?.click()

    expect(toggledBox.value).toBe('email')
  })

  it('el que aún no existe no se puede marcar y dice que llegará', () => {
    const fixture = mountAddons([])

    at(fixture, 'plugin-redis')?.click()

    expect(toggledBox.value).toBeNull()
    expect(at(fixture, 'soon-redis')?.textContent).toContain('Próximamente')
  })
})

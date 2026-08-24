import { Injectable, computed, inject, signal } from '@angular/core'
import { DesignStore } from './design-store'

/**
 * Qué se está editando: la vista dibujada, la entidad elegida y, dentro de ella,
 * la columna. Vive fuera de los lienzos porque lo comparten el panel de vistas,
 * el diagrama, el lienzo y el inspector, y se clampa contra el diseño: borrar la
 * última vista —o la columna elegida— no puede dejar apuntando a un hueco.
 */
@Injectable({ providedIn: 'root' })
export class ActiveViewService {
  private readonly store = inject(DesignStore)
  private readonly _index = signal(0)
  private readonly _resource = signal<string | null>(null)
  private readonly _field = signal<number | null>(null)
  private readonly _flow = signal<string | null>(null)
  private readonly _system = signal<string | null>(null)
  private readonly _flowNode = signal<string | null>(null)

  readonly index = computed(() => Math.min(this._index(), Math.max(this.store.pages().length - 1, 0)))

  /** Vista de sistema abierta en el lienzo (login/users/account, spec 57); null = vista del diseño. */
  readonly systemView = this._system.asReadonly()

  /**
   * Índice a marcar en los menús de vistas del diseño. Con una vista de sistema abierta
   * no hay ninguno: `index` sigue recordando la última —el lienzo vuelve ahí al salir de
   * Sistema— pero marcar las dos a la vez sería mentir (visto 2026-08-24: Panel y Usuarios).
   */
  readonly designIndex = computed(() => (this._system() === null ? this.index() : null))

  /** Entidad cuyo detalle enseña el inspector; null cuando no hay nada elegido. */
  readonly resource = this._resource.asReadonly()

  /** Columna elegida dentro de la entidad; null si no hay, o si ya no existe. */
  readonly field = computed(() => {
    const index = this._field()
    if (index === null) return null
    const fields = this.store.resources().find(r => r.name === this._resource())?.fields
    return fields && index < fields.length ? index : null
  })

  select(index: number): void {
    this._index.set(index)
    // la entidad elegida era de la vista anterior: el inspector no debe sobrevivir al salto
    this._resource.set(null)
    this._field.set(null)
    this._system.set(null)
  }

  /** Abre una vista de sistema: el lienzo pasa a solo lectura hasta volver a una del diseño. */
  selectSystem(id: string): void {
    this._system.set(id)
    this._resource.set(null)
    this._field.set(null)
  }

  selectResource(resource: string | null): void {
    if (resource !== this._resource()) this._field.set(null)
    this._resource.set(resource)
  }

  /** Elegir columna arrastra a su entidad: el inspector necesita las dos. */
  selectField(resource: string, field: number | null): void {
    this._resource.set(resource)
    this._field.set(field)
  }

  /**
   * Flujo dibujado. Sin elección explícita manda el primero, así que el lienzo de
   * Flujos nunca queda en blanco teniendo flujos, y si el elegido desaparece se
   * cae al que quede en vez de apuntar a un nombre fantasma.
   */
  readonly flow = computed(() => {
    const flows = this.store.flows()
    const chosen = this._flow()
    if (chosen && flows.some(flow => flow.name === chosen)) return chosen
    return flows[0]?.name ?? null
  })

  /** Nodo elegido dentro del flujo; null si no hay o si ya no existe. */
  readonly flowNode = computed(() => {
    const id = this._flowNode()
    if (!id) return null
    const nodes = this.store.flows().find(flow => flow.name === this.flow())?.nodes
    return nodes?.some(node => node.id === id) ? id : null
  })

  selectFlow(name: string): void {
    if (name !== this._flow()) this._flowNode.set(null)
    this._flow.set(name)
  }

  selectFlowNode(id: string | null): void {
    this._flowNode.set(id)
  }
}

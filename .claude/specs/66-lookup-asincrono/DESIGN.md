# Diseño técnico: Lookup asíncrono

Cero backend nuevo: el typeahead usa el GET de listado con `search` (ya indexa el campo
buscable del destino) y `findOne` para resolver la etiqueta al editar.

## `app-lookup` (kernel, `files-ui/spartan/shared/components/ui/lookup.ts`)

ControlValueAccessor con valor `string | null` (el id). HTML plano (input + lista
posicionada), sin HlmSelect: el popover de Spartan no admite input dentro del trigger.

- inputs: `options: AppSelectOption[]`, `placeholder`, `controlId`.
- output: `searchChange(term)` con debounce de 300 ms.
- El texto visible es la etiqueta de la opción seleccionada; teclear abre la lista y emite
  búsquedas; elegir fija el id y cierra; blur restaura la etiqueta vigente.
- Reutiliza `AppSelectOption` (mismo contrato valor/etiqueta).

## Servicio emitido

```ts
/** Typeahead de referencias (spec 66): búsqueda propia, SIN tocar el request compartido. */
lookup(search: string): Promise<Dto[]> {
  return firstValueFrom(this._http.get<OffsetPaginatedOutput<Dto>>(API_URL, {
    params: this.buildParams({ page: 1, pageSize: 20, ...(search ? { search } : {}) })
  })).then(page => page.items)
}
```

`findOne` deja de estar condicionado a `detail || formPage`: cualquier recurso puede ser
destino de una referencia y la edición necesita resolver la etiqueta del id vigente.

## Diálogo y página-formulario

Por cada campo con `lookup` (destino R, etiqueta L):

- `readonly <campo>Options = signal<AppSelectOption[]>([])` + `on<Campo>Search(term)` que
  llama a `_RService.lookup(term)` y mapea `{value: id, label: item.L}`.
- Constructor: siembra con `on<Campo>Search('')`.
- Al editar (effect existente): `findOne(id)` del destino → se antepone la opción vigente si
  no está en la lista.
- Plantilla: `app-lookup` en lugar de `app-select` para `f.lookup` (los select de enum no
  cambian).

Las substitutions `lookupComputedLines` se sustituyen por las nuevas líneas generadas en
`build-substitutions` (plantillas tontas). `formPageLookupProviders` (mocks de los specs
emitidos) se adapta al nuevo contrato (`lookup: () => Promise.resolve([])`, `findOne`).

## Validación

Tests del generador (emisión de kernel + service + diálogo), golden re-baseline revisado a
mano (contract/customer y app golden cambian), demo regenerada + humo de navegador
(buscar mascota por nombre y guardar).

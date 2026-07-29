---
name: frontend-patterns
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when working in libs/frontend on any Angular code: services, components,
  signals, resource(), forms, dialogs, routing, KPI cards, DataTable. Use when
  the user says "servicio", "componente", "signal", "resource", "formulario",
  "diálogo", "ruta", "KPI", "tabla", "spartan", "directiva", "pipe".
---

> **Contexto acelerador (2026-07-29)**: esta skill ya no gobierna código escrito a mano, sino **el código
> que emiten las plantillas del generador**. La referencia viva es `docs/referencia/libs/frontend/` (sap-licenses).
> Toda ruta `libs/frontend/...` citada abajo se refiere a ese repo de referencia. Si una plantilla emite código
> que viola estos patrones, la plantilla está mal.


# Patrones de frontend — Angular 21 con Signals + Spartan NG

Estos patrones están implementados en el prototipo `../aurora-catalyst-prototype/`. **Léelos ahí antes de implementar.** No improvises basándote solo en este resumen.

## Servicios con `resource()` — patrón canónico

```typescript
// libs/frontend/core/services/contracts.service.ts
@Injectable({ providedIn: 'root' })
export class ContractsService {
  private readonly http = inject(HttpClient)

  // Estado del listado (page, filters, etc.)
  readonly request = signal<{ page: number; pageSize: number; filters?: ... }>({
    page: 1,
    pageSize: 20
  })

  // resource() carga reactivamente cuando cambia request()
  // Angular 21: la opción es `params` (NO `request`) y el loader recibe `{ params }`
  readonly contracts = resource({
    params: () => this.request(),
    loader: ({ params }) =>
      lastValueFrom(
        this.http.get<OffsetPaginatedOutput<ContractDto>>('/api/v1/contracts', { params: { ...params } })
      )
  })

  readonly isLoading = computed(() => this.contracts.isLoading())
  readonly error = computed(() => this.contracts.error())

  // Mutaciones — recargan el resource al terminar
  async create(input: RegisterContractDto): Promise<void> {
    await lastValueFrom(this.http.post<void>('/api/v1/contracts', input))
    this.contracts.reload()
  }

  async update(id: string, input: UpdateContractDto): Promise<void> {
    await lastValueFrom(this.http.put<void>(`/api/v1/contracts/${id}`, input))
    this.contracts.reload()
  }

  async remove(id: string): Promise<void> {
    await lastValueFrom(this.http.delete<void>(`/api/v1/contracts/${id}`))
    this.contracts.reload()
  }
}
```

**Reglas críticas:**

- Un servicio por entidad. Vive en `libs/frontend/core/services/`.
- `providedIn: 'root'` siempre.
- `inject()` para dependencias, no constructor injection.
- `resource()` para datos async; nunca `subscribe()` ni `BehaviorSubject` ad-hoc. **Angular 21 renombró `request` → `params`** (opción de fábrica y `ResourceLoaderParams.params`). Si usas `request`, el valor llega `undefined` al loader y falla en silencio. Ignora firmas antiguas (`request:`) en DESIGN.md de specs viejas.
- Mutaciones llaman al endpoint y luego `.reload()` el resource.
- KPIs y agregados derivados con `computed()` desde `contracts()`.

## `resource().value()` LANZA en estado de error — leer siempre vía `hasValue()`

Verificado en el fuente de `@angular/core` (Angular 21, `BaseWritableResource`): si el loader falló, leer
`value()` lanza `ResourceValueError`. Un template con `@if (res.value(); as x) ... @else { not found }`
**crashea entero** ante un fallo de API y la pantalla se congela en la vista anterior — el `@else` nunca
se renderiza. `hasValue()` devuelve `false` en error sin lanzar y es reactivo (es un `computed` interno).

Patrón canónico para pantallas de detalle (aplicado en `contract-detail` y `customer-detail`):

```typescript
// value() lanza si el resource está en error: hasValue() es la única lectura segura.
readonly contract = computed(() => (this._service.contract.hasValue() ? this._service.contract.value() : undefined))
readonly loading = this._service.contract.isLoading
// Un 404 significa "no existe", no "falló la carga": va al estado not-found, no al de error.
readonly notFound = computed(() => {
  const error = this._service.contract.error()
  return error instanceof HttpErrorResponse && error.status === 404
})
readonly loadError = computed(() => this._service.contract.error() !== undefined && !this.notFound())
```

```html
@if (loading()) {
  <p class="text-muted-foreground py-12 text-center text-sm">Cargando contrato…</p>
} @else if (loadError()) {
  <div class="py-12 text-center">
    <p class="text-destructive text-sm">No se pudo cargar el contrato</p>
    <button class="text-primary text-sm underline" (click)="goBack()">Volver a la lista</button>
  </div>
} @else if (contract(); as c) {
  <!-- detalle -->
} @else {
  <!-- not found (cubre el 404 y el value undefined) -->
}
```

Notas:

- `error()` devuelve el `HttpErrorResponse` tal cual (pasa el check interno `isErrorLike`; Angular no lo envuelve),
  así que el mapeo `status === 404 → not-found` es fiable.
- **Los mocks de servicio en specs de componente deben emular esta semántica**: `value()` como función que lanza
  si hay error y `hasValue()` que devuelve `false` sin lanzar. Un mock con `value: signal(...)` plano oculta el
  crash y la suite en verde no protege nada:

```typescript
// Mock fiel a la semántica real de resource()
const value = signal(contract)
contract: {
  value: () => {
    if (state.error) {
      throw new Error('Resource is currently in an error state')
    }
    return value()
  },
  hasValue: () => !state.error && value() !== undefined,
  isLoading: signal(state.isLoading ?? false),
  error: signal(state.error)
}
```

## Mocks → API real (migración quirúrgica)

Mientras el backend no está listo, el `loader` devuelve mock data:

```typescript
loader: () =>
  Promise.resolve({
    items: MOCK_CONTRACTS,
    total: MOCK_CONTRACTS.length,
    page: 1,
    pageSize: MOCK_CONTRACTS.length,
    totalPages: 1
  })
```

Migración a HTTP real cuando el endpoint esté listo:

1. Confirma que `ContractDto` está en `@sap-licences/shared/domain`.
2. Sustituye `Promise.resolve(MOCK)` por la llamada HTTP en el `loader`.
3. En `create/update/remove`, sustituye `// FASE REAL` por la llamada HTTP y elimina actualizaciones locales optimistas.
4. **Elimina** el fichero `mocks/{entity}.mock.ts`.
5. Actualiza tests: sustituye `Promise.resolve(mockData)` por `HttpTestingController`.

**Un commit por servicio migrado. No mezclar mock y HTTP en el mismo fichero.**

## Componente lista — patrón canónico

```typescript
@Component({
  selector: 'app-contracts-list',
  standalone: true,
  imports: [DataTable, HlmButtonDirective, ...],
  template: `
    <app-data-table
      [data]="contracts()?.items ?? []"
      [columns]="columns"
      [isLoading]="isLoading()"
      [error]="error()"
      (create)="openCreateDialog()"
      (edit)="openEditDialog($event)"
      (remove)="confirmRemove($event)"
    />
  `
})
export class ContractsListComponent {
  private readonly service = inject(ContractsService)
  private readonly dialog = inject(HlmDialogService)

  readonly contracts = this.service.contracts
  readonly isLoading = this.service.isLoading
  readonly error = this.service.error

  // Interfaz real: `ColumnDef` (de shared/components/data-table), propiedad `label` (NO `header`)
  readonly columns: ColumnDef[] = [
    { key: 'contractNumber', label: 'Nº contrato', type: 'text', sortable: true },
    { key: 'status', label: 'Estado', type: 'badge', badgeMap: CONTRACT_STATUS_BADGES },
    // ...
  ]

  openCreateDialog(): void { /* ... */ }
  openEditDialog(row: ContractDto): void { /* ... */ }
  confirmRemove(row: ContractDto): void { /* hlm-alert-dialog */ }
}
```

## Diálogo con FormBuilder (CRUD plano)

```typescript
@Component({
  selector: 'app-contract-dialog',
  standalone: true,
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">...</form>`
})
// `toast` es una FUNCIÓN importada, no un servicio inyectado:
import { toast } from '@spartan-ng/brain/sonner'

export class ContractDialogComponent {
  private readonly fb = inject(FormBuilder)
  private readonly service = inject(ContractsService)

  readonly mode = input.required<'create' | 'edit'>()
  readonly initialValue = input<ContractDto | null>(null)

  readonly form = this.fb.group({
    contractNumber: ['', [Validators.required, Validators.maxLength(50)]],
    customerId: ['', Validators.required]
    // ...
  })

  ngOnInit(): void {
    if (this.initialValue()) this.form.patchValue(this.initialValue()!)
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return
    try {
      if (this.mode() === 'create') {
        await this.service.create(this.form.value as RegisterContractDto)
        toast.success('Contrato creado')
      } else {
        await this.service.update(this.initialValue()!.id, this.form.value as UpdateContractDto)
        toast.success('Contrato actualizado')
      }
    } catch (err) {
      toast.error('Error al guardar')
    }
  }
}
```

### Reset del diálogo — remontar con `@if (dialogOpen())`

El `<hlm-dialog>` solo togglea su `state` (open/closed); el contenido **no** se destruye. Si dejas el
componente del diálogo montado permanentemente, el formulario **conserva los valores** de la apertura
anterior (al reabrir "Nuevo" tras crear/cancelar aparece el último dato). El `effect` que hace
`patchValue` desde el input solo cubre edición y no se re-dispara en `null → null`.

**Patrón correcto**: envolver el diálogo en `@if (dialogOpen())` para **remontarlo en cada apertura**
(form fresco con defaults). Cubre todos los casos sin lógica de reset frágil.

```html
<hlm-dialog [state]="dialogOpen() ? 'open' : 'closed'" (closed)="dialogOpen.set(false)">
  @if (dialogOpen()) {
  <app-contract-dialog [contract]="editingContract()" (saved)="onSave($event)" />
  }
</hlm-dialog>
```

Es el estándar de los 3 diálogos CRUD (contracts, customers, licenses). Verificar el reset en el gate
visual (abrir → rellenar → cancelar → reabrir "Nuevo" → form limpio).

> **Dos capas (no confundir):** el **host** (list component) controla apertura/cierre con `<hlm-dialog [state]=… (closed)=…>` + `@if (dialogOpen())` remount (esto de arriba). El **componente de contenido** del diálogo envuelve su plantilla en `<hlm-dialog-content *hlmDialogPortal="let ctx">` (ver `customer-dialog.component.ts` y VISUAL-CONTRACT §25). Son complementarios, no alternativas.

## Layout admin — sidebar + header

Existe un único shell admin en `libs/frontend/domains/admin/layout/`. Para activar/desactivar módulos:

1. Añade la ruta en `domains/admin/routes.ts` (lazy load del componente).
2. Añade la entrada del menú lateral en `domains/admin/navigation-data.ts` con `icon` (lucide), `label` y `route`.

## Interceptores HTTP — funcionales

Tres interceptores en `libs/frontend/core/http/`:

- `apiPrefixInterceptor` — añade el prefix de API según `environment.ts`
- `authTokenInterceptor` — inyecta Bearer
- `errorInterceptor` — captura errores HTTP y los mapea a `ErrorResponse`

⚠️ En tests de servicio **NO incluir `apiPrefixInterceptor`**. `HttpTestingController` intercepta la URL cruda del servicio, no la prefijada.

## Tests de servicio — patrón canónico

```typescript
function setup() {
  TestBed.configureTestingModule({
    providers: [
      ContractsService,
      provideHttpClient(), // sin apiPrefixInterceptor
      provideHttpClientTesting()
    ]
  })
  const service = TestBed.inject(ContractsService)
  const httpTesting = TestBed.inject(HttpTestingController)
  return { service, httpTesting }
}

it('should expose contracts from resource', async () => {
  // ARRANGE
  const { service, httpTesting } = setup()

  // ACT
  // (el resource se dispara automáticamente al leer .contracts())

  // ASSERT
  const req = httpTesting.expectOne(r => r.url === '/api/v1/contracts' && r.params.get('page') === '1')
  req.flush({ items: [ContractMother.create()], total: 1, page: 1, pageSize: 20, totalPages: 1 })

  await new Promise(r => setTimeout(r, 0)) // microtask flush
  expect(service.contracts.value()?.items).toHaveLength(1)
})
```

## Tests de componente — patrón canónico

```typescript
it('should open create dialog on button click', async () => {
  // ARRANGE
  // Si el componente lee el resource directamente (detalles), el mock debe emular la semántica
  // real: value() lanza en error y hasValue() no — ver sección "resource().value() LANZA".
  const mockService = {
    contracts: { value: signal({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }) },
    isLoading: signal(false),
    error: signal(undefined)
  }
  await render(ContractsListComponent, {
    providers: [{ provide: ContractsService, useValue: mockService }]
  })

  // ACT
  fireEvent.click(screen.getByRole('button', { name: /nuevo contrato/i }))

  // ASSERT
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

**No verificar implementación interna** (no `expect(component.dialogOpen()).toBe(true)`). Usar queries semánticas.

⚠️ **`@testing-library/user-event` NO está instalado.** Usar `fireEvent` de `@testing-library/angular`: `fireEvent.click(el)`, `fireEvent.input(el, { target: { value } })`.

### Config de testing de componentes (Vitest + Angular)

Testear **componentes** con template requiere el compilador de Angular, no solo esbuild (los servicios/interceptores sin template compilan solo con esbuild). Ya configurado:

- `libs/frontend/vite.config.ts`: plugin `@analogjs/vite-plugin-angular` (`angular()`), `resolve.tsconfigPaths: true`, **alias explícitos** `@spartan-ng/helm/*` → `libs/ui/<name>/src/index.ts`, y `test.server.deps.inline: [/libs\/ui\//, /@spartan-ng/]`. Los alias explícitos hacen falta porque `tsconfigPaths` nativo no resuelve los cross-imports `@spartan-ng/helm/*` que ocurren DENTRO de `libs/ui` (fuera del root del proyecto).
- `libs/frontend/src/test-setup.ts`: importa `@analogjs/vite-plugin-angular/setup-vitest` antes de `initTestEnvironment`.
- **Dialog helm**: montar el componente dentro de un host `<hlm-dialog state="open"><app-x .../></hlm-dialog>` y consultar con `render`/`screen`/`fireEvent`.
- **Disparar el `resource()` en tests** (zoneless): `TestBed.flushEffects()` (vía `ApplicationRef.tick()`); después varios `await Promise.resolve()` para drenar la cadena async del loader antes de leer `.value()`.

## Tests e2e — Playwright con API mockeada

Capa e2e del front, separada de los unit de Vitest (spec 13). Combinación estándar de industria y default de Nx: **Vitest (unit/component) + Playwright (e2e)**.

- **Dónde**: proyecto Nx separado `apps/frontend-app-e2e` (convención Nx para Playwright; runner, tsconfig y globals aislados de Vitest — no co-ubicar con el código). Tests en `e2e/<área>/*.spec.ts`, soporte en `e2e/support/`.
- **Correr**: `make test-e2e-front` (envuelve `nx run frontend-app-e2e:test:e2e`). Playwright levanta `nx serve frontend-app` como `webServer`; solo Chromium.
- **Estrategia API mockeada**: se sirve **solo el frontend**; toda petición `/api/**` se intercepta en el navegador. **No se levanta backend ni la BD del puerto 5433.** Helper `e2e/support/api-mock.ts`:
  ```ts
  await mockApi(page, {
    'GET /api/v1/auth/me': unauthenticated(),   // helpers: ok/created/noContent/unauthenticated/notFound/serverError
    'POST /api/v1/auth/login': ok(adminUser())
  })
  ```
  - Clave `"MÉTODO /path"`, match exacto de pathname. Llamar **antes** de `page.goto` (cubre el `GET /auth/me` del bootstrap).
  - **Default-deny**: cualquier `/api/**` no declarado → 500, para que un test no pase en falso por una llamada que se escapó.
- **Fixtures tipadas** (`e2e/support/fixtures/`): devuelven DTOs reales de `@sap-licences/shared/domain` (p.ej. `adminUser(): CurrentUserDto`) → un cambio de DTO rompe el e2e en compilación, no en runtime.
- **Sesión por cookie**: "estar logueado" en e2e = mockear `GET /auth/me` con un usuario (no hay `storageState`, porque sin backend nadie setea la cookie).
- **Títulos y comentarios en inglés** (convención de código); los selectores contra la UI real van en su idioma (`'Acceder'`, `'Contraseña'`).

**Cuándo usar cada capa** (pirámide): lógica/estados de un componente o servicio → **Vitest**; camino crítico de usuario extremo-a-extremo (routing, guards, redirecciones, flujo completo) → **e2e Playwright**; fidelidad visual contra el prototipo → **gate visual Playwright MCP** (no sustituye a los e2e codificados, los complementa).

## DataTable — usar el componente compartido

Vive en `libs/frontend/src/shared/components/data-table.ts` (clase `DataTable`, selector `app-data-table`). **La interfaz de columnas es `ColumnDef`** (`key`, `label`, `sortable?`, `filterable?`, `editable?`, `type?`, `badgeMap?`, `minWidth?`) — fuente única en ese fichero; usar `label`, nunca `header`. Capacidades que DEBE tener (todas presentes en el prototipo):

- Búsqueda global client-side
- Filtros por columna (popover con operadores)
- Ordenación tri-state (ASC → DESC → none)
- Visibilidad de columnas
- Columnas sticky (acciones izquierda)
- Paginación con ellipsis
- Acciones por fila configurables
- Export CSV/Excel
- Celdas tipadas: text, number, date, badge (con `badgeMap`)
- Botón crear (opcional, emite `(create)`)

## KPI cards

Estructura habitual en el prototipo: `hlm-card` con título, valor grande, delta opcional y barra de progreso CSS. Implementar como componente reutilizable o como template inline según el caso del prototipo.

## Cuándo PARAR y preguntar

- El prototipo usa un componente Spartan que no conoces. **Léelo** en el prototipo. Si sigue sin estar claro, **pregunta**.
- Una validación de formulario no está clara. **Pregunta** los límites antes de inventarlos.
- Hay un patrón nuevo (sub-formularios, FormArray, etc.). **Pregunta** antes de introducir un patrón sin precedente en el proyecto.

## Lo que NO se hace en v1

- **No formularios con FormArray** (sub-formularios anidados). Si aparece el caso, preguntar primero.
- **No optimistic UI updates** complejos. Mutación → reload del resource es suficiente.
- **No cache local con localStorage/IndexedDB** sin instrucción explícita.
- **No componentes wrapper sobre Spartan** — usar Spartan directo.

# Design: Campos desnormalizados en el resource-schema

## Decisión de diseño 0: reutilizar `form.lookup.denormalizes`, NO crear un tag nuevo

La exploración del código reveló que el schema **ya declara** la desnormalización: el campo FK
lleva `form.lookup: { resource, labelField, denormalizes }` (`resource-types.ts:79-86`) y los
modelos golden (`contract.model.ts:115-136`, `project.model.ts`) ya la usan. Hoy la resolución
la hace el diálogo Angular (`build-substitutions.ts` `denormLines`): calcula la etiqueta con un
`find()` en memoria y la manda en el payload.

Crear el tag `denormalized: { from, field }` propuesto en REQUIREMENTS duplicaría la misma
información en el campo destino. Se descarta (KISS): la declaración existente contiene todo
(`from` = el propio campo FK, `field` = `labelField`, destino = `denormalizes`). Lo que cambia
esta spec es **quién resuelve**: del navegador al use case.

```
ANTES                                          DESPUÉS
dialog: find(id).name → payload.customerName   dialog: NO envía customerName
DTO HTTP: @IsString customerName!              DTO HTTP: sin customerName
use case: confía en input                      use case: lookup CustomerRepository.get(fk)
                                                         → 404 si no existe
                                                         → copia customer.name.value
```

## Estructura calculada en el generador (plantillas tontas)

`build-substitutions.ts` deriva, por recurso, la lista de denormalizaciones a partir de los
campos con `form.lookup.denormalizes`:

```
denormalizations: [{
  targetField: 'customerName',      // lookup.denormalizes
  targetClass: 'CustomerName',      // VO del campo destino (para tipos si hace falta)
  fkField: 'customerId',            // el campo que declara el lookup
  originResource: 'customer',       // lookup.resource
  originClassName: 'Customer',
  originPropertyName: 'customer',
  originPluralClassName: 'Customers',
  originPlural: 'customers',
  originFileName: 'customer',
  originField: 'name'               // lookup.labelField
}]
```

Toda la lógica (nombres de clase, rutas de import) vive en `build-*.ts`; las plantillas EJS
solo iteran líneas pre-renderizadas, como `dragModules` y `app.code`.

## Cambios por capa

### 1. `libs/schema` — validación (`define-resource.ts` `validateField`)

Hoy `form.lookup` no se valida en absoluto. Nuevas reglas:

- `lookup.resource` y `lookup.labelField` no vacíos.
- Si hay `lookup.denormalizes`: debe nombrar un campo existente del propio recurso.
- El campo destino de `denormalizes` NO puede declarar `form` propio (el valor no lo aporta
  el usuario). Mensajes de error con la ruta del problema, como el resto de `validateField`.

(No se puede validar aquí que `lookup.resource` exista o que `labelField` sea campo suyo:
`defineResource` valida un recurso aislado. Fuera de scope.)

### 2. DTOs de escritura — el campo desnormalizado no viaja

- **DTO HTTP** (`build-entrypoints.ts:100-102`): añadir los campos destino de denormalización
  al filtro de exclusión de `registerDtoFields`/`updateDtoFields` (junto a `syncManaged`, etc.).
  Con `whitelist: true` del ValidationPipe, un `customerName` colado por HTTP se descarta.
- **Input de aplicación** (`register-__fileName__-input.dto.ts.template`): generalizar el
  patrón `code` — `RegisterXInput = Omit<RegisterXProps, 'code' | 'customerName'> & {...}`.
  El generador emite la lista de claves omitidas; el agregado sigue exigiendo el campo en
  `RegisterXProps` (el use case lo aporta).
- **Update**: `UpdateXInput.updates` sigue siendo `XUpdateProps` (el agregado necesita poder
  recibir el campo), pero el DTO HTTP no lo expone: solo el use case lo pone.

### 3. Use cases — lookup y copia (precedente: `CodeSequencePort` y `dragModules`)

**Register** (`register-__fileName__-usecase.service.ts.template`):

```ts
constructor(
  private readonly contractRepository: ContractRepository,
  private readonly customerRepository: CustomerRepository   // ← por denormalización
) {}

async invoke(input: RegisterContractInput): Promise<void> {
  // El nombre desnormalizado se copia del canon; el DTO no lo trae (spec 60).
  const customer = await this.customerRepository.get(CustomerId.create(input.customerId))
  if (!customer) {
    throw new EntityNotFoundError('Customer', input.customerId)
  }
  const contract = Contract.register({ ...input, customerName: customer.name.value })
  ...
}
```

**Update**: solo si el FK viene en `updates` (cambiar de cliente refresca la copia):

```ts
let updates = input.updates
if (updates.customerId !== undefined) {
  const customer = await this.customerRepository.get(CustomerId.create(updates.customerId))
  if (!customer) {
    throw new EntityNotFoundError('Customer', updates.customerId)
  }
  updates = { ...updates, customerName: customer.name.value }
}
contract.updateDetails(updates)
```

Las líneas se pre-renderizan en `build-application.ts` (`app.denormLookupBlocks`,
`app.denormExtraRepos`, imports); la plantilla itera. `EntityNotFoundError` ya existe en
`shared/domain/errors` (lo usa el update). El mapeo a HTTP 404 ya existe para ese error.

### 4. Módulo NestJS — DI cruzada (precedente exacto: `dragModules`, spec 38)

El módulo de cada recurso ya hace `exports: [XRepository]`. El módulo consumidor añade el
módulo origen a `imports:` reutilizando la maquinaria de `dragModules` (deduplicando si el
mismo módulo ya está por arrastre) y el use case inyecta el repositorio origen.
Sin ciclos posibles en el caso canónico: el origen de un lookup no referencia al consumidor.

### 5. Frontend — el diálogo deja de enviar el campo

- `build-substitutions.ts` `denormLines` (L717-722): eliminar — `formValueExtras` ya no emite
  `customerName: this.customers().find(...)`. El select del lookup y sus `computed` quedan
  igual (siguen alimentando las opciones).
- `FieldLookup.denormalizes` conserva su nombre y semántica declarativa; solo cambia el
  efecto en el emitido.

### 6. Tests emitidos (`files-tests-application`)

`register-` y `update-__fileName__-usecase.test.ts.template`: cuando hay denormalizaciones,
el TestBed/mocks incluyen el repositorio origen. Casos nuevos emitidos:
- register con FK válido persiste el valor del canon (aunque el input trajera otro… no puede:
  el tipo ya no lo admite — el test verifica el valor copiado).
- register/update con FK inexistente lanza `EntityNotFoundError`.
- update sin tocar el FK no consulta el repositorio origen.

### 7. Migración / entidad / mapper / search-config — sin cambios

El campo destino ya se declara como campo normal persistido (`customerName` con `column`,
`query`, `table`); esas capas no cambian.

## Impacto en golden

Re-baseline de `contracts` y `projects` (DTOs HTTP, input dto, use cases, module, dialog,
tests emitidos) y de las fixtures de app si sus modelos usan lookup. El diff se revisa a
mano antes de congelar: es un cambio de contrato deliberado y documentado (REQUIREMENTS).

## Riesgos

- **Orden de providers en tests emitidos**: los mocks del repo origen deben registrarse en
  todos los specs que instancian el use case (buscar usos en `files-tests-*`).
- **Estado intermedio entre commits**: con `whitelist: true` el front puede seguir enviando
  el campo mientras el backend ya lo ignora (se descarta en el pipe), así que backend y
  frontend pueden ir en commits separados sin romper la app. Verificar que el pipe emitido
  no usa `forbidNonWhitelisted`.
- **Recursos con el campo desnormalizado pero sin lookup** (license.model): sin declaración
  `form.lookup.denormalizes` no cambia nada — siguen como hoy (fuera del flujo manual).

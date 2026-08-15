# Revisión crítica — Arquitectura del acelerador

**Fecha:** 2026-07-12
**Alcance:** los 15 documentos vigentes (maestro, ADR-001…007, UML×2, resource-schema, guía generador, integración IA, contrato unidad-vista)
**Veredicto global:** el diseño es sólido y las decisiones grandes (determinismo en el centro, regla de los dos, perfiles con referencia real) están bien tomadas. Lo que sigue no reabre nada decidido: son 4 correcciones, 5 huecos y 4 mejoras, priorizados por cuánto dolerán si llegan sin resolver a la spec.

---

## A. Correcciones (contradicciones internas)

### A1. ADR-001 está parcialmente superado pero figura como "Vigente" — y contradice el principio rector

El maestro (§11) marca ADR-001 vigente para "capas, backend genérico, multi-tenant". Pero ADR-001 contiene tres cosas que el diseño final rechazó:

1. **§2 y §4.4 "UI declarativa (schema-driven)"** describen un _render engine_ que **interpreta** el schema en runtime (§2: "un motor que interpreta una definición declarativa (JSON/TS) de cada vista y la pinta"). Es exactamente lo contrario del principio "generar, no interpretar" (resource-schema §1: "el schema es entrada de un generador, no un intérprete de runtime"). Un lector nuevo —o el proceso de spec— recibe instrucciones opuestas según qué documento abra.
2. **§2 y §4.1-4.2** presentan los contratos headless + adapters como decisión adoptada _ahora_; ADR-003 los relega a Nivel 2 "bajo demanda, no especulativo".
3. **§6** recomienda multi-tenant A+RLS como _default_; ADR-005 lo convierte en perfil seleccionable (single | pooled) sin default global.

**Acción:** o se reescribe ADR-001, o (más barato) se le cambia el estado a "Superseded parcialmente por ADR-003/005 y el principio generar-no-interpretar" con una nota al inicio que diga qué secciones sobreviven (§5 backend genérico, §7 monorepo) y cuáles no (§4.4, §4.1-4.2 como presente, §6 como default). Tal como está, es una mina para el futuro tú.

### A2. "Generar una vez y poseer" choca con "cambiar piel = shared + regenerar" y con el diff de oro permanente

Tres piezas afirman cosas incompatibles entre sí:

- Guía §8.3: política recomendada "generar una vez, luego es tuyo".
- ADR-003 §2: "cambiar de librería = cambiar los componentes shared **y regenerar**".
- Guía §7: el diff de oro contra los 4 módulos reales como validación continua.

Si el código generado se posee y se edita, regenerar pisa las ediciones (ADR-003 lo reconoce como riesgo pero no lo resuelve) y el diff de oro deja de estar limpio en cuanto los módulos reales evolucionen. **La regeneración no puede ser a la vez mecanismo de evolución y operación prohibida.**

**Acción:** decidir explícitamente y escribirlo en un sitio (propuesta coherente con lo demás):

- La regeneración es **solo para crear módulos nuevos**, nunca mecanismo de actualización de módulos existentes.
- El cambio de piel en Nivel 1 se apoya casi por completo en que las features importan _shared_ — cambiar shared basta sin regenerar; la regeneración solo entra si cambia el contrato de las plantillas.
- Las 4 referencias de oro se **congelan como fixtures** (snapshot del estado actual) para validar el generador v1; no se persigue diff limpio contra el código vivo para siempre. Cuando el generador evolucione, se re-baselinea conscientemente.

### A3. ADR-004 mezcla dos mecanismos de selección de adapter incompatibles

ADR-004 §2.3 dice que el composition root **generado** registra el adapter ("`app.config: StoragePort = AzureBlobAdapter`"). ADR-004 §4-Capa A dice que los adapters se seleccionan "**por env en runtime** (12-factor): un mismo build despliega en cualquier cloud cambiando config". Son estrategias distintas con consecuencias distintas: la selección por env exige que _todos_ los adapters (y los SDKs de todos los clouds) viajen en el build; la selección en generación produce un build por proveedor con un solo SDK.

**Acción:** elegir una. Para tu caso (una app por cliente, cloud conocido al crearla) la coherente es: **el adapter se fija en generación** (composition root) y el env solo lleva configuración y credenciales _de ese_ adapter. Reservar la selección runtime para el único caso que la justifique (¿tests e2e contra MinIO/local?), que se resuelve con un segundo composition root de test, no con un switch por env.

### A4. El formato del schema difiere entre documentos

`guia-generador-nx.md` §3 usa `fields` como **array** con `tsType` + `column` explícitos; `resource-schema-customers.md` §2 usa `fields` como **objeto** keyed por nombre con `type: 'uuid'|'string'` único. También difieren en envoltorio (`defineResource()` vs objeto plano) y en dónde vive `pk`/`origin`. Son dos schemas distintos describiendo la misma cosa.

**Acción:** unificar antes de la spec (es la entrada del generador; todo lo demás depende de ella). Sugerencia: el formato de `resource-schema-customers.md` como canónico (objeto keyed, `type` semántico) y que el generador **derive** `tsType`/`column` de `type` mediante una tabla de mapeo en `generator.ts` — coherente con "plantillas tontas, lógica en el generator". La derivación explícita a mano en cada modelo es ruido y fuente de inconsistencia.

---

## B. Huecos (piezas que faltan y dolerán)

### B1. No hay modelo de distribución del kernel entre proyectos de clientes

ADR-001 pone como requisito no funcional "un bug corregido en el core se propaga a todos los proyectos". ADR-004 responde con "provisión por referencia, no copia"… **dentro de un monorepo**. Pero el acelerador genera _proyectos distintos para clientes distintos_, y ADR-007 deja abierto el envoltorio (monorepo único vs standalone). Si cada cliente vive en su repo, "por referencia" significa **paquetes npm publicados** (registro privado, versionado semántico, política de breaking changes, matriz de compatibilidad kernel↔apps) — nada de eso está decidido. Y si todos los clientes viven en un único monorepo tuyo, hay otra conversación (aislamiento, entregas, propiedad del código del cliente).

Es probablemente **la decisión abierta más cara de las que quedan**, porque condiciona ADR-004 entero (fix-once-propagate) y el ROI del catálogo. Merece un ADR-008, aunque su primera versión sea "de momento un monorepo, npm privado cuando haya 2º cliente" — pero escrito, con el disparador definido.

### B2. La propagación de la denormalización debería generarla el generador, no quedar como "limitación documentada"

ADR-002 deja la propagación de copias como action item ("definir dónde se propaga… o se documenta como limitación conocida"). En `sap-licences` se sostiene porque las copias se escriben en el sync con SAP. Pero el acelerador generaliza a clientes **sin** sync: si un usuario edita `customer.name` en la app, todas las copias en contract/license/project quedan obsoletas — es un bug de datos _por defecto_ en toda app generada.

Lo interesante es que **el schema ya sabe todo lo necesario**: qué campo es copia, de qué entidad y por qué referencia (`relation` + campo denormalizado). La propagación es derivable de forma determinista — el generador puede emitir el handler de propagación (en el `updateDetails` del agregado origen o como evento de dominio) igual que emite los `ALLOWED_FILTERS`. Propuesta: añadir al schema `denormalizedFrom: { entity, field, via }` en los campos copia, y que la plantilla del use-case de update del origen emita la actualización de las copias. Convierte la mayor debilidad de ADR-002 en código generado y testeado.

### B3. El schema no define los campos de las entidades hijas (composición)

`relations.contacts: { kind: 'composition', of: 'contact' }` referencia `contact`, pero en ningún documento se define dónde ni cómo se declaran los campos de CONTACT (o CONSUMPTION_RECORD): ¿schema anidado dentro del padre?, ¿fichero propio sin `list`/`route` (no es agregado, no tiene vista propia)? El generador debe emitir la entidad hija, su parte del mapper, la sub-tabla del detail y el `getWith*` del repo — sin definición de campos del hijo no puede. Es un hueco del formato, y toca a 2 de los 4 módulos de oro (customers, licenses), así que bloqueará la validación por diff.

> Nota 2026-07-12: `resource-schema-customers.md` §2 y §6 ya declaran los campos del hijo **anidados en `relations.{hijo}.fields`** y documentan qué emite el generador para `kind: 'composition'` (referencia de oro: el `Contact` promocionado a entidad). El hueco queda cerrado en el formato; falta llevarlo a la spec del generador.

### B4. ADR-006: el scoping por propiedad tiene que llegar a los listados, no solo al guard

El guard `@RequirePermissions` + condición sobre el registro resuelve GET/PUT/DELETE por id. Pero "un KAM ve **solo sus** clientes" implica sobre todo el **listado**: hay que inyectar `assignedKamId = user.id` en el `Criteria` de la búsqueda (y en el export, y en el count). Si el scoping vive solo en el guard, la lista filtra por lo que el usuario pide, no por lo que puede ver. ADR-006 no lo menciona, y es el punto donde más implementaciones de ownership se agujerean. Debería quedar explícito: scoping = guard (registro) **+ inyección en Criteria (colección)**, generados juntos desde la misma marca del schema.

Añadido menor: unificar el vocabulario de acciones — ADR-006 §3 usa `read/update`; el schema usa `view/edit` en `list.actions` y `export/create` en `features`. El generador que "deriva permisos del schema" necesita un mapeo único acción-schema → permiso.

### B5. Las ramas sin referencia de oro no tienen método de validación

La regla de la casa es "ningún perfil sin proyecto de referencia real", y el diff de oro valida… lo que existe a mano. Pero tres ramas del diseño **no tienen referencia**: el perfil pooled+RLS (sap-licences es single), el RBAC-con-permisos (hoy el rol es simple user/admin), y las plantillas con `tenant_id`. Para ellas el diff de oro no puede decir nada — quedan validadas solo por tests que aún no existen. No es un error (la alternativa sería construir referencias especulativas, contra YAGNI), pero conviene reconocerlo en el maestro y sacar la consecuencia: **la primera app pooled real es la referencia de oro de esa rama**, y hasta entonces la rama pooled es código no probado que quizá no deba ni escribirse (regla de los dos aplicada a los perfiles: generar la rama pooled cuando haya cliente pooled).

Relacionado técnico (para cuando llegue): RLS con pool de conexiones exige `SET LOCAL` dentro de transacción (o wrapper por request) — un `SET` de sesión en conexión pooleada filtra el tenant al siguiente request. Y el usuario de la app no puede ser owner de las tablas (o `FORCE ROW LEVEL SECURITY`), porque RLS no aplica al owner. Ambas cosas deberían entrar en el test de conformidad del adapter `TenantContext` pooled.

---

## C. Mejoras (baratas, refuerzan el diseño)

### C1. Coherencia front↔back que sobreviva a la edición manual

Hoy la coherencia "sale gratis" **en el momento de generar**: `columns[]` y `ALLOWED_FILTERS` nacen del mismo array. Pero con "generar y poseer", en cuanto alguien edite uno de los dos a mano, la desincronización vuelve (el problema original del comentario). Mejora: en lugar de generar dos artefactos gemelos, generar **una sola constante compartida** (`libs/contracts/<recurso>.fields.ts` con los campos filtrables/ordenables/buscables) que importan tanto el `search-config` del back como el `columns[]` del front. La coherencia pasa de ser una propiedad del instante de generación a ser una propiedad estructural del código en runtime. Coste: una plantilla más; encaja con el `@raptor/contracts` que ADR-001 ya preveía.

### C2. Normalizar los 4 módulos a mano _antes_ de perseguir el diff vacío

El diff de oro asume que los 4 módulos escritos a mano son perfectamente uniformes entre sí. Casi seguro no lo son (orden de imports, pequeñas variantes de estilo, decisiones locales). Una sola plantilla no puede reproducir 4 idiosincrasias distintas — el riesgo es acabar metiendo flags en el schema para reproducir accidentes históricos (inner-platform por la puerta de atrás). Mejora: paso 0 de la spec = pasada de **uniformización de los 4 módulos** (que el diff entre ellos, módulo la sustitución de nombres, sea vacío) y después construir el generador contra esa forma canónica. Además define "diff cosmético" de forma operativa: diff tras `prettier` + orden de imports normalizado.

### C3. El gate acepta tests escritos por la misma IA que escribió el código

En el paso ② (post-generación), la IA rellena la validación de negocio **y** los tests de casos límite. El gate ("pasan los tests") tiene entonces un punto ciego: tests y código salen de la misma mano no determinista, pueden ser coherentes entre sí y ambos incorrectos. No invalida el mecanismo (compilación, boundaries y diff siguen siendo independientes), pero merece una línea en `integracion-ia-generador.md`: los _asserts_ de los tests rellenados por IA se revisan a mano (son pequeños y legibles — mismo argumento que el paso ①), o se separan las pasadas (IA-código e IA-tests en llamadas independientes sin ver la otra salida).

### C4. Declarar versión del schema desde el día 1

Los `*.model.ts` de los clientes sobrevivirán a varias versiones del generador. Un campo `schemaVersion: 1` en `defineResource` cuesta cero hoy y evita el arqueo doloroso de "¿este modelo antiguo es compatible con el generador nuevo?" mañana. ADR-001 ya lo listaba en "a revisar" (versionado del esquema); súbelo a decisión tomada.

---

## Qué haría yo con esto (orden)

1. **A4** (unificar formato del schema) y **B3** (composición en el schema) — bloquean la spec directamente; se resuelven junto con las 5 decisiones abiertas del resource-schema que ya tenías.
2. **A2** (política de regeneración explícita) y **C2** (uniformizar los 4 módulos) — definen qué significa "diff de oro" antes de escribir el primer test del generador.
3. **A1** (anotar ADR-001) y **C4** (schemaVersion) — quince minutos, evitan confusión permanente.
4. **B2** (propagación generada), **B4** (scoping en Criteria), **C1** (constante compartida) — entran en el diseño de la spec como requisitos del generador, no después.
5. **A3** (selección de adapter) y **B1** (ADR-008 distribución) — no bloquean el generador; sí deben cerrarse antes del paso 5 de la secuencia (StoragePort).

Nada de esto toca las conclusiones firmes: el generador determinista, la IA en los bordes, la regla de los dos y los perfiles con referencia real salen reforzados de la revisión, no cuestionados.

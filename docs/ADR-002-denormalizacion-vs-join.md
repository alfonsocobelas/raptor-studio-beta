# ADR-002: Denormalización vs JOIN en lectura

**Estado:** Aceptado (documenta y formaliza la decisión ya presente en `sap-licences`)
**Fecha:** 2026-07-10
**Autor:** Alfonso Domínguez
**Relacionado:** ADR-001 (arquitectura del acelerador), `guia-generador-nx.md`, `uml-modelo-dominio.md`

---

## 1. Contexto

El backend sigue Clean Architecture + DDD con **agregados referenciados por ID** (no relaciones TypeORM, no FK duras entre contextos). En el modelo actual se observa **denormalización deliberada** en las lecturas:

- `contract.customerName` es una copia de `customer.name`.
- `license` copia `customerName`, `contractNumber`, `contractEndDate` y `subSolutionAreaName`.
- `project.customerName` es copia.

Cada listado (contracts, licenses, projects, customers) se resuelve con **una query a una sola tabla**, sin joins. La capa de query genérica (`Criteria`, `ParseCriteriaPipe`) opera sobre los campos de **una** entidad.

El generador de recursos (ADR-001) depende de esta propiedad: **un agregado = un módulo = una tabla + sus hijos propios** hace que las plantillas sean deterministas y simples. Introducir joins en el listado genérico obligaría al schema a expresar campos de otras tablas, a la capa `Criteria` a soportar joins, y a las plantillas a emitirlos — un salto de complejidad que empuja hacia el _inner-platform effect_.

Fuerza en tensión: **frescura del dato (normalizar + join) vs. simplicidad de lectura y del generador (denormalizar).**

---

## 2. Decisión

1. **Listados y detalle CRUD → denormalización.** Los campos de otra entidad que se muestran en una tabla se **copian al escribir** (al sincronizar con SAP o al guardar). La lectura es de una sola tabla, sin joins. Es el patrón que genera el molde.
2. **Composición dentro del agregado → carga conjunta permitida.** Cargar los hijos propios de un agregado (contactos de un cliente, consumo de una licencia) puede hacerse con join o con una segunda query (`getWithContacts`). Está dentro de una frontera, así que no viola límites de agregado. El generador lo plantilla para relaciones `composition`.
3. **Reporting / KPIs que cruzan agregados → JOIN o read-model, pero hecho a mano.** Los cuadros de mando y métricas agregadas (consumo, partnership) usan JOINs o vistas SQL dedicadas. **No** son el patrón "listado CRUD"; son bespoke y viven fuera del generador, como _escape hatch_.
4. **Drill-down → query filtrada, no join.** "Ficha de cliente → sus contratos" se resuelve con una query filtrada por `customerId`, no con un join.

Regla: **los JOINs se quedan fuera del código generado del patrón CRUD.**

---

## 3. Opciones consideradas (lado lectura de listados)

### Opción A — Denormalizar (copia al escribir) — elegida

| Dimensión                 | Valoración                           |
| ------------------------- | ------------------------------------ |
| Complejidad de lectura    | Baja (1 tabla, sin join)             |
| Rendimiento de listado    | Alto                                 |
| Complejidad del generador | Baja (plantillas de una tabla)       |
| Frescura del dato         | Riesgo de obsolescencia              |
| Coste de escritura        | Propagar copias al cambiar el origen |

**Pros:** listados rápidos y simples; el generador se mantiene determinista y de una sola tabla; encaja con agregados-por-ID.
**Cons:** cuando cambia `customer.name`, hay que propagarlo a todas las copias (contract/license/project); storage duplicado; ventana de inconsistencia.

### Opción B — JOIN en lectura (normalizado)

| Dimensión                 | Valoración                           |
| ------------------------- | ------------------------------------ |
| Complejidad de lectura    | Media-alta (joins, índices)          |
| Rendimiento de listado    | Depende (peor en volúmenes grandes)  |
| Complejidad del generador | Alta (schema y `Criteria` con joins) |
| Frescura del dato         | Siempre fresco                       |
| Coste de escritura        | Nulo (no hay copias)                 |

**Pros:** sin duplicación; dato siempre actualizado.
**Cons:** la capa de query genérica y las plantillas deben aprender joins → complejidad que degrada la simplicidad del acelerador; índices y tuning; cruza fronteras de agregado en el modelo de lectura.

### Opción C — Múltiples queries + composición en aplicación

Cargar cada pieza por separado y componer en el use-case (lo que ya se hace en drill-down y `getWithContacts`).

**Pros:** simple, sin joins, respeta fronteras.
**Cons:** N+1 si se abusa; no sirve para listados que muestran campos de otra entidad en cada fila (ahí gana A).

---

## 4. Análisis de trade-offs

El eje es **frescura vs. simplicidad**. Para el patrón dominante del acelerador (tablas paginadas de una entidad con algún campo "prestado" de otra), la denormalización gana claramente: mantiene la lectura y el generador triviales, y el coste —propagar copias— es acotado y ocurre en el momento de escritura/sync, que es infrecuente comparado con las lecturas.

La Opción B solo compensa cuando la obsolescencia de una copia concreta se vuelve un problema real de negocio; entonces se aplica **puntualmente a ese caso**, no como default global.

---

## 5. Consecuencias

**Más fácil**

- Listados rápidos de una sola tabla.
- Generador determinista y de baja complejidad (una tabla por módulo).
- Fronteras de agregado limpias.

**Más difícil / a vigilar**

- **Propagación de copias:** cambiar un `name`/`number` de origen exige actualizar las tablas que lo copian. Debe haber un mecanismo (en el sync o en el update del agregado origen) que lo garantice, o se documenta como limitación conocida.
- **Reporting:** al vivir fuera del generador, requiere disciplina para no colar joins en el código generado. Se marca claramente como pieza a mano.

**A revisar**

- Si la obsolescencia de alguna copia concreta empieza a doler → migrar _ese_ caso a JOIN/read-model, no todo.
- Si el reporting crece → considerar vistas materializadas o un read-model separado (CQRS más explícito).

---

## 6. Action items

1. [ ] Documentar en el generador que las plantillas del patrón CRUD **no emiten joins** (solo una tabla + composición de hijos).
2. [ ] Definir dónde se propaga la denormalización al cambiar un origen (sync SAP y/o update del agregado padre).
3. [ ] Marcar el reporting/KPIs como zona _escape hatch_ (código a mano, fuera del generador).
4. [ ] Añadir al resource-schema la distinción de relaciones: `composition` (cargable junta), `reference` (denormalizada/soft), `inbound` (drill-down por query filtrada).

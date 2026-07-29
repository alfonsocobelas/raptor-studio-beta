# ADR-007: Arquetipos de arquitectura seleccionables

**Estado:** Propuesto
**Fecha:** 2026-07-10
**Autor:** Alfonso Domínguez
**Referencias reales:** `sap-licences` (DDD fullstack) · `ip-opentext-cmis-api` (bridge/proxy backend)
**Relacionado:** ADR-001, ADR-004 (adapters), `guia-generador-nx.md`

---

## 1. Contexto

No todos los clientes necesitan la misma arquitectura. Un dashboard con dominio rico justifica DDD + Clean Architecture (`sap-licences`); una API/middleware/proxy/bridge que solo reenvía a otro sistema (`ip-opentext-cmis-api`, un bridge CMIS↔OpenText) **no** — ahí DDD sería over-engineering. La arquitectura es una **elección por problema**, y el acelerador no puede hardcodear una sola.

**Hallazgo (verificado sobre los dos proyectos):** no son paradigmas opuestos. Ambos comparten la **misma espina dorsal ports & adapters** (puertos abstractos en el core, adapters en infraestructura, cross-cutting compartido). Difieren de forma **gradual**:

| | `sap-licences` | `ip-opentext-cmis-api` |
|---|---|---|
| Espina | ports & adapters | ports & adapters (**igual**) |
| Dominio | rico (agregados, VOs, use-cases) | casi nulo (traducción de protocolo) |
| Adapters envuelven | BD (TypeORM) | API externa (OpenText, vía axios) |
| BD propia | sí | no |
| UI | sí (Angular) | no (API headless) |
| Entrada del generador | definición de entidad | endpoints / mapeo upstream |

En `cmis-api`, el módulo `cmis` define puertos (`ContentRepository`, `SearchService`, `UploadService`, `UploadSessionStore`) y `opentext` los implementa como adapters con mappers/translators. El "repositorio" es un adapter sobre un sistema externo, no sobre una BD.

Esto hace el multi-arquitectura **tratable**: es la misma espina con el dominio marcado más o menos y los adapters envolviendo BD / API externa / nada.

---

## 2. Decisión

**El arquetipo de arquitectura es un perfil que se elige PRIMERO**, al crear el proyecto, porque determina la entrada del generador, las capas, y si hay BD/UI.

Se soportan **dos perfiles iniciales**, fundados en los dos proyectos de referencia (una referencia de oro por perfil):

1. **`ddd-fullstack`** (ref: `sap-licences`) — dominio rico, BD propia, UI. Agregados, VOs, use-cases, puertos, criteria. Generación **dirigida por entidad** (resource-schema). Nx monorepo con front+back.
2. **`bridge-api`** (ref: `ip-opentext-cmis-api`) — traducción/proxy a un sistema externo, sin BD propia, sin UI. Puertos + adapters sobre el sistema upstream + mappers. Dominio mínimo. Generación **dirigida por contrato/endpoints** (o starter template), no por entidad.

**Espina y kernel compartidos entre perfiles** (el valor real del acelerador, que sobrevive al cambio de arquitectura):

- Patrón ports & adapters y estructura de módulos.
- Cross-cutting: config (loaders Azure/KeyVault), logger (winston), filtros de excepción, interceptores, telemetría (OpenTelemetry), guards, upload streaming, throttler/helmet/compression.
- Adapters de infra (ADR-004) — nota: `cmis-api` ya usa Azure KeyVault/Monitor, encaja con el catálogo.
- Setup de testing (Jest), lint, Dockerfile, config por entornos.

El perfil decide **la forma del módulo y la entrada del generador**; el kernel se reutiliza.

---

## 3. Marco de decisión (qué perfil para qué problema)

```
¿La app POSEE los datos (BD propia) o RELAYA a otro sistema?
   └─ relaya (CMIS/OpenText, ERP, otra API) sin BD propia ─────► bridge-api
   └─ posee los datos:
        ¿Hay dominio con invariantes/comportamiento, o es CRUD?
           └─ CRUD/fino ───────────► (futuro) layered   [no construido: sin referencia aún]
           └─ rico + evoluciona ───► ddd-fullstack
   ¿Necesita UI?  sí → fullstack ;  no → backend-only / bridge
```

Discriminadores, por peso: **propiedad de la verdad** (¿dueño o conducto?), **complejidad de negocio**, **BD sí/no**, **UI sí/no**, **longevidad**.

> Un tercer perfil `layered` (client-service-repository con BD pero dominio fino, sin agregados/VOs) tiene sentido conceptual, pero **no se construye hasta tener un proyecto de referencia real** — no se inventa un perfil sin caso que lo pruebe.

---

## 4. Opciones consideradas

### Opción A — Perfiles fundados en referencias reales, elegidos primero (elegida)

**Pros:** cada proyecto tan simple como su problema; espina compartida; una referencia de oro por perfil garantiza que el perfil es real y validable por diff.
**Cons:** familia de generadores (entrada + plantillas por perfil); más plantillas que mantener.

### Opción B — Una sola arquitectura (DDD) para todo

**Pros:** un solo camino.
**Cons:** over-engineering para bridges/proxies (DDD sobre un pass-through). Contradice YAGNI.

### Opción C — Arquitectura totalmente parametrizable (un "meta-framework")

**Pros:** flexibilidad teórica.
**Cons:** inner-platform; imposible de mantener y razonar. Se descarta.

---

## 5. Análisis de trade-offs

El eje es **ajuste al problema vs. coste de mantener varios perfiles**. Como la espina es común y solo varían dominio/adapter-target/entrada, el coste incremental de un segundo perfil es acotado (no es una segunda base de código, es un juego de plantillas sobre el mismo kernel). El riesgo real es la proliferación: cada perfil nuevo debe justificarse con un proyecto real, no con una hipótesis.

**ROI del generador por perfil (honesto):**

- `ddd-fullstack`: **alto** — mucho boilerplate repetible por entidad. La generación dirigida por entidad brilla.
- `bridge-api`: **bajo-medio** — un bridge suele ser pequeño y a medida. El valor no es "generar desde una entidad" sino un **starter template sólido + el kernel compartido + adapters de infra**. No fuerces la generación por entidad donde no aporta.

---

## 6. Consecuencias

**Más fácil**
- Elegir la arquitectura adecuada sin pagar ceremonia de más ni de menos.
- Reutilizar la espina/kernel entre proyectos muy distintos.
- Validar cada perfil por diff contra su proyecto de referencia.

**Más difícil / a vigilar**
- Familia de generadores: entrada y plantillas por perfil.
- Decidir el **envoltorio**: `sap-licences` es Nx monorepo; `cmis-api` es una app NestJS suelta. Hay que decidir si todos los perfiles viven en un monorepo o si un bridge pequeño puede ser standalone. (Un bridge no necesita el Nx completo.)
- No añadir perfiles sin proyecto de referencia real.

**A revisar**
- Aparición de un caso `layered` (CRUD con BD, dominio fino) → crear el perfil con su referencia.
- Si un bridge crece hacia dominio propio → puede necesitar migrar de perfil (decisión consciente, no automática).

---

## 7. Action items

1. [ ] Formalizar los dos perfiles como presets del CLI: `ddd-fullstack` y `bridge-api`, elegidos como primer paso al crear proyecto.
2. [ ] Extraer la **espina/kernel compartido** (ports&adapters + cross-cutting + infra adapters + testing/lint/docker) a algo reutilizable por ambos perfiles.
3. [ ] Definir la **entrada** de cada perfil: entidad (ddd) vs. contrato/endpoints upstream (bridge).
4. [ ] Decidir el envoltorio (monorepo único vs. standalone por perfil) y documentarlo.
5. [ ] No construir el perfil `layered` hasta tener un proyecto de referencia real.
6. [ ] Validar cada perfil regenerando su proyecto de referencia y comparando por diff.

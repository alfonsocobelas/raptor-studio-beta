# ADR-003: Desacoplamiento del front de las librerías de componentes

**Estado:** Propuesto
**Fecha:** 2026-07-10
**Autor:** Alfonso Domínguez
**Relacionado:** ADR-001 (arquitectura del acelerador), `guia-generador-nx.md`

---

## 1. Contexto

Un objetivo del acelerador es poder **entregar el mismo producto funcional con diseños distintos por cliente**, incluyendo distintas librerías de componentes (Spartan NG hoy; mañana Material, PrimeNG o un design system propio).

El riesgo es el **acoplamiento**: si el código de cada pantalla importa componentes concretos de una librería, cambiar de librería obliga a reescribir features.

Estado real del código en `sap-licences`:

- **La tabla ya está desacoplada tras un componente compartido:** los listados usan `<app-data-table>` (`shared/components/data-table.ts`), no Spartan directo. Es el punto de mayor superficie y ya está encapsulado.
- **El resto sí filtra Spartan en las features:** `customers-list` importa `HlmDialogImports`, `HlmAlertDialogImports`, `HlmButtonImports` y `toast` de `@spartan-ng/brain/sonner`; `customer-dialog` usa `hlmInput`, `hlmFieldLabel`, `hlmBtn`.

Además, el **generador** (ADR-001) cambia la ecuación: el acoplamiento pasa a estar concentrado en las **plantillas** y en los **componentes compartidos**, no esparcido a mano por cada módulo.

---

## 2. Decisión

Adoptar un **desacoplamiento por capas**, subiendo de nivel solo bajo demanda real:

1. **Nivel 1 — Desacoplamiento por regeneración (ahora).** Las plantillas del generador emiten contra **componentes compartidos** (`data-table`, y añadir `form`/`dialog`/`button` shared), nunca contra Spartan directo en las features. Cambiar de librería = cambiar los componentes shared (o el set de plantillas) y **regenerar**.
2. **Nivel 2 — Contratos headless + adapters (bajo demanda).** Cuando un cliente concreto exija otra librería en runtime, las plantillas emiten contra **contratos abstractos** (`InjectionToken` + interfaces) y cada librería es un **adapter** intercambiable sin regenerar.

Criterio de salto: **no construir el Nivel 2 de forma especulativa.** Se sube solo cuando exista un cliente con requisito real de librería/piel distinta.

---

## 3. Opciones consideradas

### Opción A — Acoplamiento directo (statu quo parcial)

Las features importan Spartan directamente (como hoy en diálogos/botones).

**Pros:** cero abstracción, máxima simplicidad, acceso a toda la API de la librería.
**Cons:** cambiar de librería = editar todas las features (o todas las plantillas y regenerar sin red de seguridad de contratos). El acoplamiento está disperso.

### Opción B — Nivel 1: componentes compartidos + regeneración

Las features (generadas) solo conocen componentes shared del acelerador; la librería concreta vive dentro de esos shared.

| Dimensión          | Valoración                      |
| ------------------ | ------------------------------- |
| Complejidad        | Baja-media                      |
| Coste inicial      | Bajo (ya hecho para la tabla)   |
| Cambio de librería | Cambiar shared + regenerar      |
| Runtime            | Una librería a la vez por build |

**Pros:** barato, aprovecha lo ya hecho (`data-table`), concentra el acoplamiento en pocos ficheros. El generador amplifica: un cambio en shared se propaga por regeneración.
**Cons:** el cambio exige regenerar (o rebuild); no permite dos pieles simultáneas en la misma app; si hay ediciones a mano sobre lo generado, regenerar puede pisarlas.

### Opción C — Nivel 2: contratos headless + adapters

Las features dependen de contratos (`DATA_TABLE`, `DIALOG_SERVICE`, `BUTTON`…); cada librería es un adapter registrado en el arranque.

| Dimensión          | Valoración                               |
| ------------------ | ---------------------------------------- |
| Complejidad        | Alta                                     |
| Coste inicial      | Alto (contratos + ≥1 adapter)            |
| Cambio de librería | Proveer otro adapter (sin regenerar)     |
| Runtime            | Intercambiable por configuración/cliente |

**Pros:** desacoplamiento real; cambio de piel sin regenerar; distintos clientes con distintos adapters desde el mismo código.
**Cons:** inversión de plataforma antes de ver retorno; hay que definir y mantener el kernel de contratos; paridad imperfecta entre librerías (features que una tiene y otra no) → necesidad de _escape hatches_. Histórico de la industria: estas abstracciones tienden a filtrar.

---

## 4. Análisis de trade-offs

El eje es **coste de plataforma vs. flexibilidad de runtime**. Hoy no hay un cliente que exija piel distinta, así que pagar el Nivel 2 sería _over-engineering_ (coherente con la valoración previa: adapters ~50%, dependientes de demanda).

El generador reduce el coste de esperar: como el acoplamiento vive en plantillas + shared, subir del Nivel 1 al Nivel 2 más adelante es **cambiar las plantillas una vez** para emitir contra contratos, no reescribir features. Es decir, empezar por el Nivel 1 **no cierra la puerta** al Nivel 2; la deja barata.

---

## 5. Decisión y camino recomendado

**Empezar y quedarse en Nivel 1** hasta que haya demanda real:

- Las plantillas emiten contra `data-table` (ya) + añadir `form`/`dialog`/`button`/`toast` como componentes shared del acelerador.
- Las features generadas **no importan Spartan directamente** — solo shared. Esto se puede forzar con `@nx/enforce-module-boundaries` (prohibir imports de `@spartan-ng/*` fuera de `libs/ui` y de los shared).
- Los design tokens (color, spacing, tipografía) como CSS custom properties, independientes de la librería, para permitir rebranding sin tocar componentes.

**Subir a Nivel 2 solo cuando** un cliente pida otra librería/piel en firme. Entonces: refactor de las plantillas para emitir contra contratos + primer adapter, y a partir de ahí el cambio de librería es proveer adapters.

---

## 6. Consecuencias

**Más fácil**

- Rebranding (tokens) sin tocar código.
- Cambio de librería como operación de plantilla + shared (Nivel 1), sin editar features.
- Migración futura a Nivel 2 acotada (cambio de plantillas, no de features).

**Más difícil / a vigilar**

- Disciplina de que las features **nunca** importen la librería directamente (forzar por lint).
- Si se edita a mano lo generado, la regeneración puede pisarlo → política de "generar y poseer" clara.
- No caer en construir el kernel de contratos antes de necesitarlo.

**A revisar**

- Primer cliente con requisito de piel distinta → disparador del Nivel 2.
- Alcance del kernel de contratos cuando se llegue (evitar que se hinche).

---

## 7. Action items

1. [ ] Regla de lint: prohibir imports de `@spartan-ng/*` en features generadas (solo en `libs/ui` y componentes shared).
2. [ ] Extraer `form`/`dialog`/`button`/`toast` a componentes shared del acelerador (como ya está `data-table`).
3. [ ] Plantillas del generador emiten contra shared, nunca contra Spartan directo.
4. [ ] Design tokens como CSS custom properties.
5. [ ] Documentar el disparador de salto a Nivel 2 (cliente con librería distinta) y dejarlo como decisión pendiente, no construida.

# Diseño técnico: Vista Gantt / cronograma

> Espejo estructural de la galería (spec 17). Todo se emite; las plantillas solo interpolan.

---

## Schema (`libs/schema`)

```typescript
export interface GanttDefinition {
  /** Campo que etiqueta cada barra; por defecto, el primer texto buscable (como gallery.title) */
  title?: string
}
// ResourceDefinition: gantt?: GanttDefinition
```

Validación en `defineResource`:

- `gantt` sin `period` → `gantt: requires period (start/end dates to draw the bars)`
- `gantt.title` con campo inexistente → `gantt: unknown field '<name>'` (mismo formato que gallery)

## App-schema

- Página nueva: `GanttPage { kind: 'gantt', resource, label? }` en `PageDefinition`.
- `composeFlat`: si `model.gantt` → página `{ kind: 'gantt', label: '<plural> · cronograma' }`
  (mismo patrón que cards/galería).
- `pathOf`/ruta: `<ruta>/cronograma`, declarada tras el listado y ANTES de `:id`.

## Emisión frontend (`files-gantt/frontend/__plural__-gantt.component.ts.template`)

- Misma cabecera/estados/búsqueda/paginación que la galería (comparte servicio y request).
- Sustituciones nuevas (`renderGantt` en build-substitutions): `titleField`, `startField`,
  `endField` (de `definition.period`).
- Render sin librerías: eje = `[min(start), max(end)]` de las filas cargadas con fecha;
  divisiones por mes (líneas + etiqueta corta). Cada fila: etiqueta (ancho fijo) + carril
  con barra posicionada por porcentaje (`left`/`width` calculados en el TS, no en CSS).
- Filas sin fechas → «sin fechas», sin barra. Colores por tokens (`bg-primary`, `border`).
- `@ai:begin gantt-extra` al final, como la galería.

## Decisiones técnicas

| Decisión | Opción | Razón |
| --- | --- | --- |
| Datos | La misma lectura paginada del listado | Sin endpoint nuevo; coherente con galería |
| Escala | min→max de la página, marcas de mes | Una sola escala; YAGNI para zoom |
| Ruta | `/cronograma` (castellano, como `/galeria` y `/papelera`) | Convención existente |
| Presencia | `gantt: {}` en el resource-schema | Igual que detail/gallery/code: presencia = emisión |
| Modelo de oro | `contract` la estrena | Único golden con `period` + su lista; re-baseline deliberado |

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| Fechas nullable (contract.endDate nullable) rompen el eje | alta | medio | Filas sin ambas fechas quedan fuera del eje; barra solo con start y end válidos |
| El e2e necesita datos con fechas | media | bajo | Seed de contract está roto (samples legacy): e2e con demo (`sale`/`movement` no tienen period) → dar `period+gantt` a un modelo de demo o crear registros por UI |

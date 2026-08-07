# 15 · DESIGN

_Fases 1–3: el diseño relevante está en §2 y §3 de REQUIREMENTS (el par canónico
id + nombre denormalizado). Lo que sigue es el diseño de la **Fase 4**, aprobado
el 2026-08-07._

## Fase 4 — la vista de modelo (el diagrama)

### Decisiones cerradas

1. **Alcance**: ver el modelo + crear/quitar relaciones arrastrando. Los campos
   se siguen editando en el lienzo/inspector — el diagrama NO duplica el editor
   de columnas.
2. **Ubicación**: conmutador **Vistas / Modelo** en la cabecera del lienzo.
   Misma pantalla, mismo `DesignStore`; chat e inspector siguen donde están.
3. **Layout**: auto-layout determinista (rejilla) + arrastre de cajas con
   posiciones **solo en memoria del componente**. El layout es cosmético y no
   entra al app-schema ni al historial (§4 de REQUIREMENTS).
4. **Técnica**: artesanal — cajas como componentes Angular posicionados con
   `transform`, flechas como `<path>` con `marker-end` en un `<svg>`
   superpuesto, drag con pointer events nativos. Cero dependencias nuevas.

### Principio rector

El diagrama **no es un dibujo aparte: es otra proyección del `DesignStore`**.
Las flechas se DERIVAN de los `DraftField` con `type: 'ref'` — nunca se
almacenan. Crear una flecha añade un campo real al draft; borrarla lo quita.
Por eso una relación declarada campo a campo (o inferida por el chat) aparece
como flecha, y una flecha dibujada acaba en el resource-schema:

```
arrastre Cita ──► Paciente
        │
        ▼
DesignStore.addRelation('cita', 'paciente')
        │  añade a cita.fields:
        │  { name: 'paciente', label: 'Paciente', type: 'ref', refTo: 'paciente' }
        ▼
draftToResource() → par canónico pacienteId + pacienteName
        ▼
generador → selector en el formulario, columna «Paciente», FK en la migración
```

### Piezas

**Helpers puros** (en `apps/studio/libs/shared/domain/src/studio/`, testeables
sin DOM):

- `modelEdges(resources: DraftResource[])` → `{ from, to, fieldIndex, label }[]`
  — recorre los drafts y devuelve una arista por cada campo `ref` con `refTo`.
- `autoLayout(names: string[])` → `Record<string, { x, y }>` — rejilla
  determinista: mismo diseño, mismas posiciones.
- Geometría de anclajes: función pura que da el punto del borde de cada caja
  donde nace/muere la flecha.

**Store** (`DesignStore`):

- `addRelation(from: string, to: string): boolean` — añade a `from` un campo
  `{ name/label derivados del labelSingular de to, type: 'ref', refTo: to }`.
  Colisión de nombre → sufijo numérico (`dueno2`). Auto-referencia
  (`from === to`) → rechazada con `lastError`. Pasa por `mutate()`: el gate
  existente (`defineResource`) valida gratis.
- Borrar relación = `removeField(from, fieldIndex)` — ya existe.

**Componente** (`model-view.component.ts` en
`apps/studio/libs/frontend/src/domains/studio/design/`):

- Cajas: título (`labelSingular`) + lista de campos con tipo abreviado.
  Solo lectura por dentro.
- Interacción: arrastrar cabecera mueve la caja; arrastrar desde el asa
  lateral hasta otra caja crea la relación (flecha fantasma mientras;
  soltar en vacío cancela); clic en flecha la selecciona y ofrece borrar
  (botón + tecla Supr).
- El conmutador Vistas/Modelo es un signal local de `studio-canvas.component`.

### Gate de la fase

No toca plantillas EJS ni `generator.ts` → no hay golden-diff. El gate es:
tests vitest de helpers y store (TDD) + e2e con captura donde una relación
creada arrastrando en el diagrama aparece en la app generada (selector en el
formulario y columna en el listado).

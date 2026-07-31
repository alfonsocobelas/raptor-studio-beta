# Visión: editor visual de schemas (chat + lienzo)

**Fecha:** 2026-07-31
**Estado:** Visión aprobada en brainstorming — pendiente de spec (ejecutar tras el trabajo en curso)
**Decisión ancla:** lienzo **schema-driven** con los componentes reales del generador (no diseño libre traducido a schema)

---

## 0. Idea en una frase

Una aplicación con **chat + lienzo** donde el usuario describe la aplicación que quiere y la IA (y el propio usuario, con el ratón) editan **el resource-schema/app-schema — nunca código**. El lienzo es una proyección viva del schema renderizada con los mismos componentes Spartan/Material que emite el generador. Al terminar el diseño, un wizard de plugins elige base de datos, infra, autenticación, etc., y el generador determinista produce la aplicación.

Esto es la fase "① pre-generación: la IA escribe el MODELO, no el código" de `integracion-ia-generador.md`, con interfaz gráfica.

## 1. El "UML por debajo" ya existe

No se inventa un modelo intermedio nuevo: **la fuente de verdad es el schema** (los `defineResource` actuales más un app/page-schema por crear). El lienzo no tiene estado propio de diseño; todo lo que se ve se deriva del schema, y toda interacción muta el schema.

```
                  muta (structured output validado)
  Chat IA ──────────────────────────────┐
                                        ▼
  Usuario (hover/borrar/drag&drop) ──> resource-schemas + app-schema   (fuente de verdad)
                                        │
                                        │ deriva (unidireccional)
                                        ▼
                                 Lienzo = render con los MISMOS
                                 componentes de libs/ui que emite
                                 el generador
                                        │
                  wizard de plugins     ▼
                 (db, infra, auth) ──> generador Nx determinista ──> aplicación
```

Ejemplos del binding:

- Pasar el cursor sobre una tabla la resalta y muestra una cruz: borrar = eliminar el recurso (o su presencia en la página) del schema.
- Borrar una columna = quitar `table.show` del campo correspondiente.
- Arrastrar una tarjeta KPI desde la paleta = añadir un nodo al page-schema.
- Reordenar columnas = reordenar `fields` (o un índice de orden de tabla).

## 2. Por qué schema-driven y no diseño libre (decisión cerrada)

Se descartó el enfoque "estilo Claude Design" (la IA pinta HTML arbitrario y luego se traduce a schema) y el híbrido (explorar libre + consolidar):

- **Todo lo dibujable es generable.** La paleta solo contiene lo que el generador sabe emitir. No existen diseños huérfanos que luego no se puedan generar.
- **Sin traducción con pérdida.** No hay paso de ingeniería inversa HTML→schema, que es frágil y lossy.
- **WYSIWYG exacto.** Como el preview usa los componentes reales de `libs/ui`, no es un mockup: es literalmente lo que se va a generar.
- **Coherente con la constitución:** determinismo en el centro, IA en los bordes, y regla 7 ("generar, no interpretar" — lo raro se edita a mano sobre el código generado, no se retuerce el schema ni el lienzo).

La restricción de vocabulario es una virtud: es el mismo argumento que hace valioso al generador.

## 3. Prerrequisito real: app/page-schema (trabajo de generador, no de UI)

Hoy el resource-schema describe **un recurso** (tabla paginada + CRUD). Un lienzo invita a componer **páginas**: varias tablas, KPIs, tarjetas, layout, navegación. Antes de cualquier UI hace falta:

- Un **app-schema/page-schema**: páginas, secciones, composición de recursos y widgets (KPI, tarjeta, tabla embebida…), menú/navegación.
- Que el **generador lo consuma** (hoy la composición de la app la deciden los generadores de app/plugins con opciones planas).

Sin ese vocabulario, el lienzo no tiene nada que editar. Es la fase A y es útil por sí sola aunque la UI nunca se construya.

## 4. Descomposición en fases (cada una útil por sí sola)

| Fase | Pieza | Notas |
|------|-------|-------|
| A | **App/page-schema** + soporte en el generador | ✅ Hecha (spec 07, 2026-07-31): `defineApp` en `libs/schema`, registro `APPS`, `--app` en el generador de app con gate de equivalencia. |
| B | **Visor read-only**: schema → preview vivo | ✅ Hecha (spec 08, 2026-07-31): `apps/studio` scaffoldeado con el propio generador; visor `/studio` con los componentes reales. |
| C | **Interactividad**: resaltar al hover, borrar, drag&drop desde paleta | ✅ Hecha (spec 09, 2026-07-31): toda interacción es una mutación del app-schema validada con `defineApp`. |
| D | **Chat IA** que crea/edita el schema | ✅ Hecha (spec 10, 2026-07-31): claude-opus-5 con structured outputs en el backend del estudio; el gate valida en servidor y cliente; adapter fake sin clave. |
| E | **Wizard de plugins** (db, infra hosting, auth, email…) | ✅ Hecha (spec 11, 2026-07-31): wizard sobre las opciones reales del generador + `--appFile` como puente schema-diseñado → generador. |
| F | **Empaquetado escritorio** (Electron/Tauri) | ✅ Resuelta (spec 12, 2026-07-31, decisión de Alfonso): generación in situ vía backend local (`studio-api`, botón «Generar aquí»), sin empaquetar. Si algún día hay usuarios sin entorno de desarrollo, el empaquetado será con **Electron** (Node embebido = el generador encaja directo; Tauri exigiría un sidecar Node). |

**No se necesita app de escritorio hasta F**, y puede que nunca: una app Angular dentro del monorepo da el preview con componentes reales gratis.

## 5. Riesgos señalados

- **Es un producto en sí mismo.** Riesgo de que se coma al generador. Mitigación: fases pequeñas, cada una con valor autónomo; A y E aportan valor incluso sin lienzo.
- **Tentación de enriquecer el schema para el lienzo** (inner-platform). El schema crece solo cuando el *generador* necesita el concepto, nunca "para que se pueda dibujar".
- **Dos pieles (Spartan default, Material congelada).** El visor renderiza con la piel activa; no se diseña "por piel", se diseña schema.

## 6. Cuestiones abiertas (para la spec de cada fase)

- Granularidad del page-schema: ¿solo composición de widgets conocidos o también layout (grid/columnas)? Empezar por lo mínimo que el generador pueda emitir.
- Edición de campos desde el lienzo: ¿formulario de propiedades al seleccionar un componente (tipo inspector), o solo vía chat? Probable: inspector simple.
- Persistencia del diseño en curso: fichero(s) `*.model.ts` en el repo del cliente vs. JSON de trabajo del editor que se materializa a `*.model.ts` al finalizar.
- Undo/redo: trivial si el estado es un único árbol de schema inmutable — decidir pronto la forma del store.
- Dónde vive la app del editor: `apps/studio` en este monorepo (probable) vs. repo aparte.

## 7. Corrección de rumbo (2026-07-31, spec 13)

Feedback de Alfonso sobre la primera implementación: la esencia era un **lienzo en blanco**
(Figma/Excalidraw) con **chat a la derecha** y **barra de componentes genéricos** donde soltar
una tabla CREA una entidad nueva con sus columnas — no un editor de composición sobre modelos
de demo. Reconstruido en la spec 13: DraftResource (entidades diseñadas en el lienzo, expandidas
a resource-schemas canónicos), DesignStore vacío de arranque, barra Tabla/KPI, pestañas de
página, inspector de columnas, chat que diseña entidades (structured outputs sin catálogo), y
`--appFile` con `resources[]` embebidos — verificado e2e: entidad dibujada → app generada.
El estudio no muestra NINGÚN contenido de demos.

## 8. Relación con documentos existentes

- `docs/integracion-ia-generador.md` — el chat es la fase ① con UI; el gate determinista no cambia.
- `docs/ACELERADOR-arquitectura-consolidada.md` — nada de esto toca el núcleo determinista; el editor es un cliente más del schema.
- `docs/contrato-unidad-vista-rag.md` — la paleta de componentes es la versión visual del mismo contrato esqueleto↔pieza.

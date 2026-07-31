# Viabilidad: arquetipos de vista y componentes añadidos

**Fecha:** 2026-08-01
**Origen:** pregunta de Alfonso tras ver un diseño de Claude Design (SkillMatch AI): «¿podemos
tener distintos tipos de vista preconfigurados (vista = tabla, vista = mix 1, vista = mix 2) y
añadidos como ficheros o gráficas, sin romper el determinismo?»
**Veredicto: SÍ, viable** — con arquetipos cerrados + slots ortogonales; NO con layout libre.

---

## 1. Lo primero: separar tres cosas que el mockup mezcla

El diseño de SkillMatch tiene cuatro pantallas que parecen radicalmente distintas. Al
descomponerlas, la variedad viene de tres fuentes de coste muy diferente:

| Fuente de variedad | Ejemplo en SkillMatch | ¿Generable determinista? | Coste |
|---|---|---|---|
| **Piel / tema** (color de marca, tipografía, acentos, modo oscuro) | verde Avvale, chips redondeados, logo | ✅ Ya resuelto (ADR-003: 2 pieles) | ~0 · es tema, no vista |
| **Arquetipo de vista** (el esqueleto de la página) | «Proyectos» = galería de tarjetas · «Mi perfil» = formulario largo con secciones · «Empleados» = lista con contadores | ✅ Sí: esqueleto fijo alimentado por el schema | Medio, **una vez por arquetipo** |
| **Feature de producto** (lógica de negocio propia) | el «Asistente» (chat con IA que sugiere colaboraciones), el % de afinidad | ❌ No como arquetipo — es un plugin/feature | Alto · caso a caso |

**Conclusión 1:** buena parte de lo que hace que SkillMatch «no parezca todo igual» es **piel +
datos distintos dentro del mismo arquetipo**, no arquetipos nuevos. La ficha de perfil y la
galería de proyectos sí son arquetipos nuevos; el porcentaje de afinidad y el asistente son
features de negocio (no los da un generador de dashboards).

## 2. Qué emitimos hoy y qué canon tenemos escrito

| Arquetipo | Estado | Evidencia |
|---|---|---|
| `list` — tabla + búsqueda/filtros/orden/export + CRUD | ✅ **Emitido**, diff de oro vacío en 4 módulos | `resource` generator |
| `dashboard` — rejilla de KPI cards | ✅ **Emitido** (opción `--dashboard`) | `files-dashboard` |
| `detail` — ficha: cabecera + badges + secciones de campos + KPIs + tabla hija + adjuntos | ⚠️ **Canon escrito a mano** (4 fichas reales: customer 344 líneas HTML, qbr 180) pero **fuera del gate** por decisión previa («presentación a medida», regla 7) | `docs/referencia/.../customer-detail`, `qbr-detail` |
| `cards` — galería de tarjetas (título, subtítulo, chips, métrica, acción) | ❌ No existe canon | — |
| `form` — formulario de página completa de un único registro (perfil/ajustes) | ⚠️ Medio hecho: el **dialog** emitido ya monta secciones, controles tipados y validadores | `build-dialog` |

**Conclusión 2:** dos de los tres arquetipos que pide el mockup están **ya escritos a mano en la
referencia** (detail) o son una variante de algo emitido (form ≈ dialog a página completa). El
método para convertirlos en plantilla es el que ya usamos con list y dialog: sintetizar el canon
y validarlo con diff de oro. No es investigación, es trabajo conocido.

## 3. Slots: los «añadidos» (ficheros, gráficas, KPIs…)

Un arquetipo define el esqueleto; los **slots** son bloques opcionales que se anclan en puntos
fijos de ese esqueleto. Son **ortogonales**: cada uno emite su bloque, ninguno negocia con los
demás por el espacio.

| Slot | Backend que necesita | Coste | Nota |
|---|---|---|---|
| `attachments` (dropzone + lista) | upload/download/delete sobre `FileStoragePort` (**3 adapters ya existen**) | Bajo-medio | Spec 14, en marcha |
| `kpis` (fila de tarjetas) | endpoints de conteo (ya emitidos por el dashboard) | Bajo | Reutiliza `dashboard` |
| `chart` (barras/donut por categoría o mes) | **agregación** `GROUP BY` — es el coste real | Medio | Empezar con «cuenta por campo enum/boolean/mes» cubre ~80% de los casos |
| `timeline` (histórico) | lectura de una entidad con fecha | Bajo | Puro frontend sobre un listado ordenado |
| `comments` | entidad hija + endpoints | Medio | Ya sabemos emitir composición padre-hijo |

**Conclusión 3:** el freno no es el determinismo, es el **backend de agregación** para gráficas.
Todo lo demás es frontend derivado del schema.

## 4. La línea roja: arquetipos cerrados sí, layout libre no

```
   ✅ VIABLE                                   ❌ INNER-PLATFORM (regla 7)
   page.kind = 'cards'                         page.layout = grid 12 col
   + slots: [chart, attachments]               + componentes con x/y/w/h
   → esqueleto fijo + bloques anclados         → motor de layout arbitrario
   → plantilla EJS legible, diff de oro         → generador que compila diseños
   → el código emitido parece escrito a mano    → el código emitido es ilegible
```

Con arquetipos + slots, el nº de plantillas crece **linealmente** (una por arquetipo, una por
slot) y el gate de oro crece igual (una fixture por arquetipo, no por combinación). Con layout
libre crece de forma combinatoria y el código emitido deja de ser canónico — que es justo lo que
vende el acelerador.

## 5. Plan propuesto (incremental, cada paso útil por sí solo)

1. **Cerrar spec 14** (`attachments`): primer slot real de punta a punta. Valida el mecanismo.
2. **`page.kind: 'detail'`** — el arquetipo de mayor valor: sintetizar la ficha desde el canon de
   la referencia (secciones declaradas en el schema, badges, KPIs, tabla hija, slot attachments).
   Es el que convierte «una vista = una tabla» en «vistas distintas».
3. **Slot `chart`** — con agregación limitada y honesta: conteo por campo categórico o por mes.
4. **`page.kind: 'cards'`** — galería tipo «Proyectos»; canon nuevo, escribir a mano una vez y
   congelar (como se hizo con el dashboard).
5. **`page.kind: 'form'`** — formulario de página completa reutilizando el motor del dialog.

Lo que **no** entra: el asistente conversacional del mockup (es un producto con IA, no un
arquetipo), porcentajes de afinidad (lógica de negocio), y cualquier motor de layout libre.

## 6. Impacto en el estudio (lienzo)

Cada arquetipo aparece en la barra como una herramienta más (▦ Tabla · ▤ Dashboard · 🗂 Ficha ·
▩ Tarjetas · ✎ Formulario) y cada slot como un añadido que se suelta sobre la vista activa
(🗎 Ficheros · 📊 Gráfica · ◳ KPIs). El lienzo no cambia de arquitectura: sigue pintando lo que
el generador emite.

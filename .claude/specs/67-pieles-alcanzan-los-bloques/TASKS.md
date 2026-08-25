# Tareas atómicas: Las pieles alcanzan los bloques nuevos

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Toda tarea que toque plantillas pasa el gate de oro antes del commit (`/golden-diff`).
> Sin backend: el orden es *mecanismo → hooks en plantillas → CSS de los presets → guardas*.

## Mecanismo (el token muerto)

- [x] TASK-01: Apretar `design-preset.spec.ts` para que exija `--radius: 0` **dentro** del
      bloque `:root .theme-x { … }` (RED: hoy el token vive en `:root` y el test pasa sobre CSS
      muerto). Sin tocar producción todavía — el commit deja el test en rojo documentado, o se
      funde con TASK-02 si prefieres suite siempre verde. **Decidir al empezar.**
- [x] TASK-02: Partir `DesignPreset` en `tokens` / `darkTokens` / `css`, añadir
      `designTokens` y `designDarkTokens` a `ThemeSubstitutions`, interpolarlos dentro de los
      bloques del tema en `styles.css.template`, y mover ahí los `--radius*` de cabina y los
      `--radius*` + `--font-sans` de suite. GREEN de TASK-01.

## Contratos neutros

- [x] TASK-03: Los selectores de directiva de ambos presets ganan hermano neutro
      (`[hlmbtn], [appbtn]`, `[hlminput], [appinput]`, `[hlmbadge], [appbadge]`). Test: el
      `styles.css` de cabina y de suite cita los tres contratos.

## Hooks en las plantillas (el vocabulario)

> Cada tarea: test primero (el componente emitido contiene la clase), luego el literal en la
> plantilla. Los hooks se **añaden** a las clases Tailwind existentes — si el diff de oro
> muestra una sola línea que no sea una clase añadida, es un error.

- [x] TASK-04: Calendario — los cinco hooks (`app-panel`, `app-panel-head`, `app-toolbar`,
      `app-chip`, `app-cell`) según la tabla de colocación del DESIGN.
- [x] TASK-05: Kanban — `app-panel`, `app-panel-head`, `app-toolbar`, `app-chip`.
- [x] TASK-06: Gantt + galería — `app-panel`, `app-toolbar`, `app-chip`, y `app-cell` en la
      fila de tarea del gantt. **Punto de decisión**: si `app-cell` acaba usado sólo por el
      calendario, se retira del vocabulario y bajamos a cuatro (compromiso de Fase 1).
- [x] TASK-07: Detalle + formulario — `app-panel`, `app-panel-head`, `app-toolbar`, `app-chip`.
- [x] TASK-08: Adjuntos + importación — `app-panel`, `app-toolbar`, `app-chip`.

## Cromo de los presets

- [x] TASK-09: Cabina viste los hooks: radio 0, sin sombra, superficie transparente, rejilla
      `--shell-border`, chip uppercase monospace; claro y oscuro. Más
      `.app-toolbar button` / `.app-toolbar input` para los controles crudos de gantt, galería,
      importación y detalle. Fuera de `@layer` (lección de `2323885c`).
- [x] TASK-10: Suite viste los hooks: radio 2px, sin sombra, borde `--grid-line`, cabecera
      `--grid-head-bg`, chip rectangular; mismo tratamiento de `.app-toolbar`.

## Guardas y validación

- [x] TASK-11: `design-hooks.spec.ts` — las dos aserciones simétricas del DESIGN §D: ninguna
      plantilla de bloque con cromo se queda sin hook, ningún preset cita un hook fantasma.
      Va al final a propósito: nace verde y su trabajo es el futuro, no este cambio.
- [x] TASK-12: Gate de oro y re-baseline deliberado de las plantillas tocadas, en commit
      propio (`chore(golden): …`), con el diff revisado línea a línea.
- [x] TASK-13: Verificación en navegador: generar un diseño con calendario y kanban tres veces
      (`actual`, `cabina`, `suite`), abrir las tres, comparar y anotar el resultado en la spec.
      Es el criterio real de esta spec: si a un metro siguen pareciendo la misma app, no está
      hecha.

## Añadido sobre la marcha (no estaba en el plan aprobado)

- [x] TASK-14: cada piel trae su propia tipografía, self-hosted como la del tema (petición de
      Alfonso a mitad de la spec), y titula con un ESQUELETO distinto — mono en cabina, serif en
      suite — porque dos sans neutras se leen igual a un metro.
- [x] TASK-15: los KPIs, el interior del calendario y la letra de TODOS los números pasan al
      vocabulario (tres defectos que vio Alfonso). Nace el sexto hook, `app-metric`.
- [x] TASK-16: hooks en las superficies compartidas del kernel (diálogo, lookup, tabla de
      relacionados): el diálogo sale en todas las pantallas.
- [x] TASK-17: cinco defectos que cazó la verificación en navegador — ver VERIFICACION.md.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
TASK-04 es la más gorda (cinco hooks en una plantilla de 180 líneas): si al abrirla pasa de
~150 líneas de diff, se parte en "superficie + cabecera" y "chip + celda + toolbar".

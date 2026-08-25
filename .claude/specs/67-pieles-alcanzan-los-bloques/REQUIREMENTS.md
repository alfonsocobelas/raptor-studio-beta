# Spec: Las pieles alcanzan los bloques nuevos

## Contexto de negocio

La ranura `design` (spec 37) existe para entregar la misma app a clientes distintos con
identidad visual distinta: `actual` (neutro), `cabina` (centro de operaciones) y `suite`
(ERP corporativo). Hoy no cumple. Medido el 2026-08-25: los tres presets sólo se enganchan
a los selectores `.app-shell-main table`, `[hlmbtn]`, `[hlmbadge]`, `[hlmcard]` y
`[hlminput]`, y esos atributos `hlm*` existen únicamente en dos plantillas de todo el
emitido — `data-table.ts` y `kpi-card.ts`. El resto de las pantallas pasa por los contratos
neutros del ADR-003 (`[appBtn]`, `[appInput]`, `[appBadge]`, cuyos selectores NO son `hlm*`)
o escribe su cromo con utilidades Tailwind a pelo en la plantilla. Consecuencia observable,
y confirmada por Alfonso: **salvo las tablas, el resto de la app es idéntica en las tres
pieles**.

El desfase tiene fecha. Los presets se congelaron el 2026-08-10 (`c8cd517b`); después
llegaron formulario (08-16), transiciones (08-15), calendario (08-23) y kanban (08-24), y
gantt, galería, detalle, adjuntos e importación ya habían nacido fuera de su alcance. Sin un
punto de enganche estable, **cada bloque que añadamos volverá a nacer neutro**: eso es lo que
esta spec cierra, no sólo el retraso acumulado.

Hay además un segundo defecto, silencioso e independiente: el preset declara sus tokens en
`:root` (elemento `html`), pero el tema los redeclara en `:root .theme-x` sobre `<body>`
(`files-theme/.../styles.css.template:12` + `files/.../index.html.template:9`). Más
especificidad y más cerca del contenido → gana el tema, y los `--radius*` / `--font-sans`
del preset se ignoran en todo el subárbol del body.

```
html   :root { --radius: 0px }                       ← preset (cabina)   ... ignorado
 └ body.theme-neutral   :root .theme-neutral { --radius: 0.5rem }   ← gana (0,1,1 y más cerca)
     └ .rounded-lg  →  var(--radius-lg)  →  0.5rem
```

Cabina hoy aplana botones y badges por casualidad (pone `border-radius: 0` a mano en esos
selectores), no por token.

## User stories (formato EARS)

- WHEN se genera la misma app con `design=cabina` y con `design=actual` THEN las pantallas de
  calendario, kanban, gantt, galería, detalle, formulario, adjuntos e importación se ven
  distintas entre sí (superficie, radio, densidad y tipografía), no sólo la tabla y los KPIs.
- WHEN un preset declara `--radius: 0px` THEN las utilidades `rounded-*` de cualquier
  plantilla emitida resuelven a 0, sin que el preset tenga que repetir `border-radius` por
  selector.
- WHEN una plantilla emitida pinta una superficie, una cabecera de panel, una tira de
  controles, una pastilla de dato o una celda de rejilla no-tabla THEN lo marca con una clase
  del vocabulario de hooks, y el preset la viste desde el CSS.
- IF se añade un bloque generable nuevo cuya plantilla frontend pinta cromo sin ningún hook
  del vocabulario THEN la suite falla, con el nombre de la plantilla en el mensaje.
- WHILE se visten los hooks THEN ninguna plantilla emitida importa nada de la librería de
  componentes ni conoce el preset activo: el ADR-003 sigue en pie y las pantallas siguen
  siendo agnósticas.

## Vocabulario de hooks (mínimo deliberado — cinco clases, ni una más)

| Clase | Qué marca | Ejemplos de uso |
| --- | --- | --- |
| `app-panel` | superficie contenedora de un bloque | tarjeta del calendario, columna del kanban, panel de gantt, ficha de detalle |
| `app-panel-head` | cabecera de esa superficie (título + controles) | barra de mes del calendario, cabecera de columna kanban |
| `app-toolbar` | tira de controles o pie de vista | selector de vista del calendario, pie de totales, barra de acciones del formulario |
| `app-chip` | pastilla de dato | evento del calendario, tarjeta del kanban, etiqueta de galería/detalle |
| `app-cell` | celda de rejilla que NO es `<table>` | día del calendario, fila de gantt |

El preset viste el vocabulario. Las plantillas nombran, nunca deciden.

## Criterios de aceptación

- [ ] Los overrides de token del preset (`--radius*`, `--font-sans`) ganan al bloque del tema
      sin interpolar `themeClass` en el CSS del preset, y hay un test que lo fija.
- [ ] Los presets se enganchan también a los contratos neutros `[appbtn]`, `[appinput]`,
      `[appbadge]`, además de a los `hlm*` que siguen sirviendo a data-table y kpi-card.
- [ ] Las 8 plantillas frontend de bloque (calendario, kanban, gantt, galería, detalle,
      formulario, adjuntos, importación) llevan hooks del vocabulario en su cromo.
- [ ] `cabina` y `suite` declaran reglas para las cinco clases del vocabulario, en tema claro
      y oscuro donde el preset ya tenga los dos.
- [ ] Test de anti-desfase: cada plantilla frontend de bloque que pinte cromo contiene al
      menos un hook, y cada hook citado por un preset existe en alguna plantilla.
- [ ] Gate de oro con diff explicado y re-baseline deliberado de las plantillas tocadas.
- [ ] Verificación en navegador: un diseño con calendario y kanban generado tres veces
      (`actual`, `cabina`, `suite`), las tres pantallas comparadas a ojo y anotadas.

## Referencias del proyecto de referencia

- `libs/generators/src/generators/app/design/presets.ts` — la ranura y sus dos aportaciones
- `libs/generators/src/generators/app/files-theme/spartan/apps/frontend-app/src/styles.css.template` — dónde entra `designCss`
- `docs/ACELERADOR-arquitectura-consolidada.md` — ADR-003 (contratos neutrales de UI)
- `.claude/specs/59-bloque-calendario/`, `.claude/specs/61-bloque-kanban/` — los bloques que llegaron tarde

## Reglas de negocio aplicables

- **ADR-003**: las pantallas emitidas consumen contratos neutrales; cambiar de librería de
  componentes no cambia las pantallas. Los hooks son clases CSS, no dependencias: no lo violan.
- **Plantillas tontas**: el hook es un literal en la plantilla; el CSS que lo viste vive en
  `presets.ts`. Cero lógica de piel en las plantillas.
- **Un preset aporta dos cosas y ninguna más** (`files` + `css`). Esta spec no lo amplía:
  sigue siendo CSS y override de esqueleto.
- **Generar, no interpretar**: el vocabulario cubre el caso canónico. Un cliente con un cromo
  irrepetible edita a mano sobre el código generado.

## Fuera de scope (deliberado)

- Presets nuevos. Siguen siendo tres.
- Que las plantillas dejen de usar utilidades Tailwind: los hooks se **añaden** al cromo
  actual, no lo sustituyen. El neutro debe seguir viéndose exactamente igual que hoy.
- Migrar los contratos neutros a directivas basadas en `hlm*`.
- Vestir el shell de las pieles (ya lo hacen vía `files-design/`).
- Tokens semánticos nuevos en el tema (spec 20): esta spec no toca la paleta.

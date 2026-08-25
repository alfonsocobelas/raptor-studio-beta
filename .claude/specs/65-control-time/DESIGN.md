# Diseño técnico: Control de hora

Espejo del control `date` en todas las capas; el valor es SIEMPRE el string `HH:mm` que
emite el `input type="time"` nativo — sin objetos Date, sin zona horaria.

- Schema: `FormControl` += `'time'`.
- build-substitutions: unión de `control` += `'time'`; `valueType` → como date
  (`string` / `string | null`).
- build-entrypoints `dtoField`: rama por `form.control === 'time'` antes del string genérico:
  `@IsString` (+`@IsNotEmpty` si requerido) + `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)`.
  `collectValidators` recoge `Matches` solo (regex por nombre de decorador).
- Plantillas dialog y form-page: rama `f.control === 'time'` → `<input type="time">`.
- Estudio: `DraftFieldType` += `'time'` (elegible), etiqueta «hora», `draftToResource` case
  'time' → string requerido, `form.control 'time'`, `column varchar(5)`; FIELD_TYPES del
  adapter del chat y del gate.

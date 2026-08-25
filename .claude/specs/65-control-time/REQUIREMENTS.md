# Spec 65: Control de hora (`time`)

## Contexto

La demo veterinaria destapó que «hora» solo puede modelarse como `string` → el generador
emite un `input` de texto libre. Un campo de hora debe editarse con el control nativo
(`input type="time"`) y validarse `HH:mm` en el borde del API.

## User stories (EARS)

- WHEN un campo declara `form.control: 'time'` THEN el diálogo y la página-formulario emiten
  `input type="time"` y el DTO valida `HH:mm` 24h (`@Matches`); el valor viaja como string.
- WHEN en el estudio un campo se marca de tipo «hora» THEN cruza al resource-schema como
  string con control `time` (columna varchar(5)) y el chat puede proponer ese tipo.

## Criterios de aceptación

- [ ] `FormControl` del schema admite `'time'`; plantillas de diálogo y form-page lo rinden.
- [ ] DTO emitido: `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)` (+ imports auto-recolectados).
- [ ] Estudio: tipo «hora» elegible en el panel, etiqueta, cruce `draftToResource`, tipos del
      chat (adapter + gate).
- [ ] Golden en verde (ningún modelo de oro usa time: diff vacío esperado).
- [ ] Demo veterinaria: `hora` como time, regenerada y verificada.

## Alcance

Generador (`resource-types`, `build-substitutions`, `build-entrypoints`, plantillas dialog y
form-page) + estudio (`draft-resource`, `field-type-labels`, adapter del chat, gate). Sin
tipo de columna `time` en BD (varchar basta; YAGNI).

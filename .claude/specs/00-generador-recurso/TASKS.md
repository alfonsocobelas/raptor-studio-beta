# Tareas atómicas: Generador de recurso (arranque)

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.

---

## Arranque del repo

- [x] **TASK-01**: Inicializar workspace Nx vacío (preset ts, sin apps) + prettier/eslint/editorconfig con las convenciones del proyecto + `.gitignore`
- [x] **TASK-02**: Añadir `@nx/plugin` y generar el esqueleto del generador `resource` en `libs/generators` (comprobar que `nx generate @acc/generators:resource --dry-run` corre con el ejemplo por defecto)

## Modelo y plantilla

- [x] **TASK-03**: Transcribir `contract.model.ts` (dato puro) desde la entidad real de `docs/referencia` — campos, columnas, defaults, índices, unique
- [ ] **TASK-04**: `generator.ts`: cargar el modelo, calcular sustituciones (`names()`, helpers) y expandir `files/` — con test unitario del cálculo de sustituciones (TDD)
- [ ] **TASK-05**: Plantilla `typeorm-__name__.entity.ts.template` — iterar hasta **diff vacío** contra la entidad real de contracts (el diff es el test RED→GREEN)

## Cierre

- [ ] **TASK-06**: Documentar en el README del repo cómo ejecutar el generador y cómo validar por diff
- [ ] **TASK-07**: Verificación final: `--dry-run` + generación + diff vacío + lint verde; marcar spec como completa

---

## Regla del juego

- Implementar **UNA** tarea, commitear en develop, esperar aprobación, siguiente.
- Si una tarea parece > 1h o > ~150 líneas, **partirla en subtareas** antes de empezar.
- Si descubres una dependencia oculta que la spec no contempla, **PARA** y reporta antes de seguir.

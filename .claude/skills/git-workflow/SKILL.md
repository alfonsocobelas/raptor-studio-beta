---
name: git-workflow
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when about to commit, when a task is completed, when the user says "commit",
  "haz commit", "termina", "cierra la tarea", or after implementing any atomic unit
  of work. Also when asking about commit messages or Conventional Commits.
  SIMPLIFIED MODE (2026-07-29): single develop branch, direct commits, no PRs.
---

# Git workflow — modo simplificado (develop-only)

> **Decisión 2026-07-29 (temporal):** se elimina el arnés gitflow/PRs de sap-licences para avanzar
> más rápido. Una sola rama `develop`, commits directos. Cuando el proyecto madure se reinstaurará
> el flujo completo (base: `docs/referencia/.claude/specs/51-gitflow-workflow-governance/`).

## El ciclo

```
tarea atómica → suite verde → commit en develop → marcar [x] en TASKS.md → PARAR
```

- **No se crean ramas** de feature/fix. Todo va a `develop`.
- **No se abren PRs.** El push a `origin/develop` (si hay remoto) se hace solo cuando Alfonso lo pida.
- Sin gitflow no hay red de seguridad de revisión: el gate de tests y el diff de oro **no son opcionales**.

## Formato del mensaje (se mantiene íntegro)

**En inglés siempre.** Subject en minúscula, sin punto final, líneas ≤100 chars.

```
<tipo>(<scope>): <descripción imperativa en minúsculas>

<cuerpo opcional>

<footer opcional para BREAKING CHANGE o refs>
```

Tipos: `feat` `fix` `refactor` `style` `test` `docs` `chore` `perf` `build` `ci`.

Scopes habituales del acelerador: `generators`, `schema`, `golden`, `infra`, `infra-azure`, `claude` (arnés), `docs`. Transversal → sin scope.

Ejemplos buenos:

```
feat(generators): add typeorm entity template for resource generator
feat(schema): add defineResource field constraints
test(generators): add golden diff for contract entity
chore(golden): re-baseline after search-config pattern change
chore(claude): adapt skills from sap-licences reference
```

**Sin firma ni coautoría del asistente** (ni `Co-Authored-By: Claude…` ni `Generated with…`).

## Regla de oro: un commit = una tarea atómica

- Una tarea de TASKS.md = un commit. No mezclar.
- Si un commit toca demasiadas cosas, deshacer y dividir.
- Re-baseline de fixtures de oro: **siempre commit propio**.

## Gate antes de commitear

1. **Suite verde** del ámbito tocado (cuando exista el workspace: `nx test` / targets del Makefile).
2. **Build verde** si se tocó frontend del studio: `npm run web:build` en `apps/studio` (`ng build`).
   **No basta `npm run typecheck`**: `tsc` no compila las plantillas Angular, así que un `NG8002`
   —un `[input]` que el componente no declara— pasa el gate y solo aparece en el log del build.
   Y mientras el build falla, `ng serve` sigue sirviendo el último bundle bueno: ningún cambio de
   UI llega al navegador. Visto el 2026-08-27 con `app-kpi-card` (`delta`/`percent`/`progress`/`target`).
3. **Gate de oro** si se tocaron plantillas o `generator.ts` (`/golden-diff` → diffs vacíos).
4. **Nunca commitear**: secretos, `.env` con credenciales, `tfplan`/`*.tfvars.json`, nada de
   `docs/referencia/iac/terraform/terraform.auto.tfvars.json` ni `docs/referencia/probe.env`.

## Confirmación previa al commit

```
Voy a commitear en develop:
- Mensaje: <tipo>(<scope>): <descripción>
- Ficheros: {lista}
- Tests: ✅/❌ · Golden diff: ✅/❌/N-A
¿Procedo?
```

Solo procede tras confirmación explícita.

## Tras el commit

1. `git log -1 --oneline` para confirmar.
2. Marcar `[x]` la tarea en su `TASKS.md`.
3. **PARAR.** No empezar la siguiente tarea ni pushear por cuenta propia.

## Prohibiciones que siguen vigentes (guard activo)

`git push --force` / `-f`, `git reset --hard origin`, reescritura de historia publicada.

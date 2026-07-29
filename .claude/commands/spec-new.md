---
description: Crea el esqueleto de una spec nueva (REQUIREMENTS + DESIGN + TASKS) para una feature/pantalla
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
allowed-tools: Bash, Read, Write, Glob
---

# /spec-new — Crear spec para una feature

Vamos a crear una spec nueva siguiendo el flujo Spec-Driven Development.

## Pasos a seguir

1. **Pregunta al usuario** (una sola vez, todas las preguntas juntas):
   - Nombre corto de la feature (ej: "customers-list", "contract-detail", "qbr-evidence-upload")
   - Módulo/patrón de oro de referencia asociado (ruta dentro de `docs/referencia/`), si aplica
   - Si aplica a backend, frontend o ambos
   - Prioridad y dependencias con otras specs existentes

2. **Comprueba** que no existe ya una spec con ese nombre listando `.claude/specs/`. Si existe, propón otro nombre o pregunta si se quiere editar la existente.

3. **Crea el directorio** `.claude/specs/{NN-nombre-feature}/` donde `NN` es el siguiente número correlativo (01, 02, 03...).

4. **Genera los tres ficheros** usando las plantillas de la skill `spec-driven-workflow`:
   - `REQUIREMENTS.md` — solo con el esqueleto vacío + secciones rellenas con lo que el usuario te ha dicho
   - `DESIGN.md` — solo el header, sin contenido (se rellena en Fase 2)
   - `TASKS.md` — solo el header, sin contenido (se rellena en Fase 3)

5. **NO rellenes contenido inventado**. Si te falta información para REQUIREMENTS, pídela al usuario después de crear el esqueleto.

6. **Reporta al usuario**:

   ```
   ✅ Spec creada: .claude/specs/{NN-nombre}/
   📝 Siguiente paso: rellenar REQUIREMENTS.md

   ¿Empezamos por las user stories en formato EARS, o quieres redactarlas tú?
   ```

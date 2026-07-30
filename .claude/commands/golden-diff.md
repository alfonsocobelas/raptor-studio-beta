---
description: Regenera las referencias de oro y reporta el diff contra las fixtures congeladas
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
allowed-tools: Bash, Read, Glob
---

# /golden-diff — Gate de oro del generador

Valida que el generador reproduce los 4 módulos de oro. Es el gate obligatorio antes de commitear
cambios en `libs/generators/**` o `libs/schema/**`.

## Pasos

1. **Lee la skill `golden-diff`** para el procedimiento y el criterio de veredicto.

2. **Ejecuta el gate**: `npm run golden:diff` (regenera cada modelo registrado en
   `tools/golden-diff.sh` y compara cada fichero generado contra su fixture).

3. **Si una entidad aún no tiene fixture o modelo registrado**, no aparece en el gate — no es un fallo.

4. **Reporta**:

```
🏅 Golden diff
customer: ✅/❌/N-A · contract: ✅/❌/N-A · license: ✅/❌/N-A · project: ✅/❌/N-A

{Para cada ❌: ficheros afectados y primeras líneas del diff}

Veredicto: {apto para commit / NO commitear hasta vaciar los diffs}
```

5. **NO modifiques fixtures ni plantillas** desde este comando: es solo el gate. Las correcciones
   van por el flujo normal (tarea + TDD); el re-baseline, por el procedimiento de la skill `golden-diff`.

# Diseño técnico: el emitido compila

> Diseño aprobado en brainstorming 2026-08-04.

---

## 1. La medición de partida

App con `--models=customer,contract,license,project`, generada, **movida fuera del árbol del
acelerador**, `npm install` + `tsc`:

```
  TS2307 (módulo no encontrado)  54   →  49 familia A + 5 familia C
  TS2322 / TS2345 (tipos)        19   →  familia B
  TS7006 / TS2339                 2   →  arrastre de A (implícitos por el módulo que falta)
  ─────────────────────────────────
  75
```

Fuera del árbol es imprescindible: dentro, el `node_modules` del monorepo resuelve por hoisting lo
que el emitido no declara, y el fallo no aparece.

## 2. Familia C — el generador deja de contradecirse

**C1. `skipEmit` era una decisión de gate disfrazada de decisión de emisión.**

```
  HOY   resource.ts:  for (const skip of model.skipEmit) tree.delete(skipPaths[skip])
        → el repositorio emitido importa './customer.mapper', que no existe

  NUEVO el fichero se emite SIEMPRE; el modelo declara qué rutas NO se comparan en el golden,
        y `golden-diff.sh` las salta para ese modelo
```

El motivo original sigue respetado: el mapper de la referencia lleva extras a mano que el canon no
cubre, así que compararlo no tiene sentido. Lo que no tiene sentido es no emitirlo.

**C2. Los imports del seed se filtran a los modelos que emiten seeder.** `app.ts` construye
`seedImports` / `seedModules` / `seedRuns` para todos los modelos; pasan a construirse sólo para los
que cumplen la misma condición que usa `resource.ts` al emitir el seeder (`entry.emit && app.writes`).

## 3. Familia B — el fallback, para todos los campos

`build-aggregate.ts` decide cómo se construye cada campo en `fromPrimitives`. Los campos con VO ya
reciben fallback; los crudos no. La regla pasa a ser uniforme: si el primitive es opcional y el
agregado lo exige `Nullable<…>`, el campo se construye con `?? null`.

```
  ANTES   waveStage: props.waveStage
  DESPUÉS waveStage: props.waveStage ?? null
```

No se toca la forma de los tipos (`PrimitiveProps` opcional / `AggregateProps` obligatorio): esa
asimetría es deliberada — quien construye desde primitives puede omitir el campo, y el agregado
siempre tiene un valor explícito.

## 4. El gate

```
  nx run generators:typecheck-emitted
    1. genera la app en tmp/ (dentro, porque el generador escribe en el árbol de Nx)
    2. la MUEVE fuera del árbol (directorio temporal del sistema)
    3. npm install --no-audit --no-fund
    4. tsc -p tsconfig.json --noEmit
    5. falla con el recuento de errores; limpia siempre
```

Fuera del golden a propósito: ~2 min por app. Se corre al cerrar una spec y en CI.

**Verificación del gate**: se introduce un import roto a propósito en una plantilla y se comprueba
que el gate se pone rojo. Un gate que no se ha visto fallar no vale nada — lección de esta sesión.

**Alcance inicial**: la app de demo (`--app=boutique`), que compila limpia. Cambiar a la de oro es
el criterio de cierre de la spec 27.

## 5. Testing

- Unit (plugin): el mapper se emite aunque el modelo declare `skipEmit`; el seed no importa piezas
  de modelos sin seeder; `fromPrimitives` aplica el fallback a los campos crudos.
- Golden: 6 gates vacíos, con la exclusión de comparación para los mappers declarados.
- Gate nuevo: verde con la app de demo, y rojo con un import roto inyectado.
- Medición final: la app de oro baja a 49 errores, todos de familia A.

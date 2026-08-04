# Tareas atómicas: adjuntos ejercitados y validados en el dominio

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde antes de cada commit (el re-baseline es TASK-05).

---

## Dominio

- [x] **TASK-01**: Tests + los tres VOs en el kernel (`attachment-file-name.vo.ts`,
      `attachment-mime-type.vo.ts`, `attachment-size-bytes.vo.ts`), espejo del canon `qbr` y sobre
      las clases base que el kernel ya emite. Sin consumidores todavía: salida sin cambios.
- [x] **TASK-02**: El servicio de adjuntos valida construyendo los VOs en vez de con `if`s. Se
      conservan el `storageKey` UUIDv7 de backend y el rollback del binario.

## Contrato del generador

- [x] **TASK-03**: Guard `attachments` + `--database=mongo` → error claro antes de emitir nada, con
      test. Los adjuntos emiten una entidad TypeORM, así que en Mongo romperían el candado de la
      spec 23.

## Ejercitarlo

- [x] **TASK-04**: `attachments: true` en `project.model.ts` y la fixture mongo pasa a
      `customer,contract,license` (conserva softDelete, se queda sin adjuntos). Golden con diff
      **esperado** en las dos fixturas → se congela en TASK-05.
- [x] **TASK-05**: Re-baseline de las dos fixturas de app, revisión del diff a mano, commit propio
      `chore(golden): …`. Los 6 gates en verde.

## Verificación end-to-end

- [x] **TASK-06**: Subida real contra la app generada. **Hecha 2026-08-04, 4/4 en verde** contra
      Postgres real (compose emitido) y disco real (`LocalFileStorage`), sin dobles:
      · el binario llega al disco con su contenido y los metadatos a su tabla; el listado lo devuelve
      · un MIME fuera de la allowlist se rechaza y NO deja rastro (ni fila ni fichero)
      · un fichero por encima del máximo se rechaza
      · forzando el fallo de los metadatos, el binario se borra: sin huérfanos
      · **no se pudo verificar por HTTP ni con el arranque de integración emitido**: ambos importan
      el repositorio del agregado, y el dominio emitido de `project` NO COMPILA por dos defectos
      ajenos a los adjuntos (ver más abajo). El servicio de adjuntos sí es autocontenido, así que
      la verificación se montó con un DataSource propio sobre la app generada
      · el arnés usado quedó en `tmp/upload-check` (desechable); el aprendizaje es que **este test
      debería emitirlo el generador**: hoy la pieza de adjuntos no tiene ningún test emitido

## Defectos del generador que bloquearon la verificación (reportados, no arreglados)

1. **VOs compartidos sin emitir** (ya era la obs. 22 del ROADMAP): el dominio de `project` importa
   `customer-id.vo`, `contract-date.vo`, `customer-name.vo` y `period.vo`, que el generador no emite.
   28 errores de tipos en la app generada. Es la SEGUNDA vez en esta sesión que bloquea una
   verificación real.
2. **Desajuste optional/nullable en el agregado emitido** (nuevo): `project.ts` asigna
   `props.waveStage` (`string | null | undefined`) a `ProjectAggregateProps.waveStage`
   (`Nullable<string>`), y lo mismo con `waveStatus`. Falla también en el builder emitido.

---

> Deuda arrastrada de la spec 24, no perder: **TASK-08 de esa spec sigue pendiente** — compilar una
> app sin infra y una app azure FUERA del árbol del acelerador. Es el criterio que motivó la spec 24
> (dentro del monorepo el hoisting tapa las dependencias no declaradas) y quedó sin verificar al
> abrir esta.

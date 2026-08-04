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
- [ ] **TASK-05**: Re-baseline de las dos fixturas de app, revisión del diff a mano, commit propio
      `chore(golden): …`. Los 6 gates en verde.

## Verificación end-to-end

- [ ] **TASK-06**: Subida real contra la app generada (`infra=none`, adapter de disco local, sin
      cuenta de Azure): `POST` multipart, binario en el almacenamiento, metadatos en la tabla, y el
      camino de error sin dejar huérfanos. Anotar el resultado en esta spec.

---

> Deuda arrastrada de la spec 24, no perder: **TASK-08 de esa spec sigue pendiente** — compilar una
> app sin infra y una app azure FUERA del árbol del acelerador. Es el criterio que motivó la spec 24
> (dentro del monorepo el hoisting tapa las dependencias no declaradas) y quedó sin verificar al
> abrir esta.

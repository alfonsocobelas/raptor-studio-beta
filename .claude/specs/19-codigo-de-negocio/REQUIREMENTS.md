# 19 — Código de negocio autogenerado

**Estado:** ACTIVA (retomada 2026-08-10) — las cuatro decisiones abiertas, cerradas
**Depende de:** 15 (fase 1, cerrada) · se integra con 33 (import CSV)

> Hecho ya: TASK-01, el contrato `code` en el resource-schema con sus
> validaciones. Es INERTE: ninguna plantilla lo consume todavía.
>
> **Decisiones cerradas (2026-08-10):**
>
> 1. **Secuencia continua, sin año** (`PAC-0001`, nunca se reinicia). Una sola
>    secuencia Postgres por entidad. La numeración por año exigiría una secuencia
>    por entidad-y-año y decidir el corte exacto: no lo pide ningún caso real y
>    queda para una spec propia si aparece.
> 2. **Prefijo derivado con override opcional**: tres primeras letras en
>    mayúsculas por defecto, `prefix` del schema manda si se declara (necesario
>    cuando dos entidades colisionan: `proyecto`/`producto` → ambas `PRO`). Es lo
>    que ya declara `CodeDefinition`; se confirma, no se cambia.
> 3. **Correlatividad legal fuera**: ningún modelo emite documentos fiscales. Un
>    hueco tras un alta fallida es aceptable para un identificador de referencia;
>    la numeración sin huecos de facturación es otra spec con otras garantías.
> 4. **El código puede venir de fuera** (Alfonso, 2026-08-10): el caso real más
>    común no es dar de alta desde cero, sino **importar un Excel de un sistema
>    que ya tenía sus identificadores**. Si el código llega, se respeta; si no
>    llega, lo asigna la secuencia. Ver §2.bis.

## 1. Problema

Cada registro tiene su uuidv7, pero es ilegible y el canon no lo muestra en las
tablas (ningún módulo de oro lo hace; customers identifica por CIF/NIF). El
resultado es que un paciente o un propietario no tienen NADA por lo que
referirse a ellos: ni al teléfono, ni en un correo, ni en una conversación.

Las apps de gestión reales resuelven esto con un código corto y legible —
`PAC-0001`, `EXP-2026-0042`— que el sistema asigna y el usuario no edita.

## 2. Decisiones de diseño

**Formato.** `<PREFIJO>-<secuencia con relleno>`: prefijo derivado de las tres
primeras letras del nombre de la entidad en mayúsculas (`paciente` → `PAC`),
relleno a 4 dígitos. Ambos ajustables desde el diseño.

**Quién lo asigna.** El backend, salvo que el código venga con el dato (§2.bis).
El **formulario** nunca lo propone: ahí sí sería falsificable, y por eso el campo
no aparece en el alta manual ni en el update.

**Dónde vive el contador.** Una SECUENCIA de Postgres por entidad
(`<schema>.<plural>_code_seq`). Es la única forma de que dos altas simultáneas
no reciban el mismo número; `MAX(code)+1` en aplicación es una carrera
esperando a ocurrir. La secuencia se consulta desde un puerto de dominio
(`CodeSequencePort`), no desde el agregado: la persistencia queda detrás de su
frontera, como el resto del canon.

**Huecos.** Si un alta falla tras consumir el número, ese número se pierde. Es
correcto: las secuencias no se reciclan y la alternativa (reutilizar huecos)
exige bloqueos que no compensan. Un contador de facturas legalmente correlativo
es otro problema y no lo resuelve esta spec.

**No editable.** El código no aparece en el formulario ni en el update; sí en
la tabla (primera columna), en la ficha y en el buscador.

## 2.bis Códigos que vienen de fuera (migración desde otro sistema)

El caso más frecuente en cliente real no es el alta desde cero: es **importar un
Excel de un sistema que ya venía numerando** (`PT-00447`, un id de SAP…). Ese
identificador es un dato del registro, no algo que debamos inventar — y pisarlo
rompe la trazabilidad con el sistema origen, que es lo primero que el cliente
pregunta («¿puedo seguir buscando por mi número?»).

**Regla: asignar si falta, respetar si viene.** `code` entra como campo
**opcional** en el `RegisterInput`:

```
  alta manual (formulario)     import CSV (spec 33)
  code ausente                 code: 'PT-00447'
       ↓                            ↓
  nextval() de la secuencia    se respeta tal cual
       ↓                            ↓
        ambos → UNIQUE en la columna decide
```

- El formulario de alta **sigue sin mostrar el campo**: no cambia nada de la UI.
- El importador de la spec 33 pasa a aceptar `code` y la plantilla CSV
  descargable lo incluye como columna opcional.
- **Colisión**: si el código que llega ya existe → 409 por fila, igual que ya
  hace el importador con cualquier unique. Si el que choca es el que generó la
  secuencia (posible al mezclar datos importados del mismo formato con altas
  nuevas), se reintenta con el siguiente valor; sin bloqueos ni artificios.

## 3. Alcance

- `code` en el resource-schema: presencia = emitir; `prefix` y `padding` opcionales.
- Migración: `CREATE SEQUENCE` + columna `code VARCHAR UNIQUE NOT NULL`.
- Puerto `CodeSequencePort` en el kernel + adapter TypeORM (`nextval`).
- El caso de uso de alta pide el código **solo si el input no lo trae** (§2.bis).
- El `RegisterInput` acepta `code` opcional; el importador (spec 33) lo pasa.
- Frontend: columna en el listado y fila en la ficha; nunca en el formulario.
- Semillas: reciben código como cualquier alta (pasan por el caso de uso).
- Estudio: la entidad puede declarar código; el chat lo propone cuando encaja.

## 4. Fuera

- Numeración por año (`EXP-2026-0001`) — se puede añadir luego al formato.
- Códigos legalmente correlativos sin huecos (facturación).
- Renumerar o reasignar códigos existentes.
- **Re-sincronización continua** con el sistema origen (que el código importado
  siga cambiando después). Aquí se importa una vez y el código queda fijo; un
  upsert que actualice existentes ya está fuera de la spec 33 también.

## 5. Gate

Golden diff vacío (los modelos de oro no declaran código) + app generada donde
se crea un registro y recibe el siguiente código, visible en la tabla.

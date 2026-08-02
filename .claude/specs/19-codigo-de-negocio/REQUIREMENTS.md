# 19 — Código de negocio autogenerado

**Estado:** EN PAUSA (2026-08-02) — Alfonso quiere pensar el formato antes de emitir
**Depende de:** 15 (fase 1, cerrada)

> Hecho ya: TASK-01, el contrato `code` en el resource-schema con sus
> validaciones. Es INERTE: ninguna plantilla lo consume todavía, así que no
> afecta a nada generado. Retomar por TASK-02.
>
> **Decisiones abiertas antes de seguir:**
> 1. ¿Numeración por año (`EXP-2026-0001`)? Cambia cuándo se reinicia el contador.
> 2. ¿Prefijo derivado del nombre o siempre explícito en el diseño?
> 3. ¿Hace falta algún caso con correlatividad legal (sin huecos)? Eso NO lo
>    resuelve una secuencia y sería otra spec.

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

**Quién lo asigna.** El backend, SIEMPRE, nunca el cliente ni el formulario. Un
código propuesto desde fuera sería falsificable y colisionaría.

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

## 3. Alcance

- `code` en el resource-schema: presencia = emitir; `prefix` y `padding` opcionales.
- Migración: `CREATE SEQUENCE` + columna `code VARCHAR UNIQUE NOT NULL`.
- Puerto `CodeSequencePort` en el kernel + adapter TypeORM (`nextval`).
- El caso de uso de alta pide el código antes de construir el agregado.
- Frontend: columna en el listado y fila en la ficha; nunca en el formulario.
- Semillas: reciben código como cualquier alta (pasan por el caso de uso).
- Estudio: la entidad puede declarar código; el chat lo propone cuando encaja.

## 4. Fuera

- Numeración por año (`EXP-2026-0001`) — se puede añadir luego al formato.
- Códigos legalmente correlativos sin huecos (facturación).
- Renumerar o reasignar códigos existentes.

## 5. Gate

Golden diff vacío (los modelos de oro no declaran código) + app generada donde
se crea un registro y recibe el siguiente código, visible en la tabla.

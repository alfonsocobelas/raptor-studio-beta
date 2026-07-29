# Spec: {Nombre de la feature}

> Plantilla — copia este directorio `_template/` y renómbralo a `NN-nombre-feature/` para una spec nueva.
> Después rellena los campos entre `{}` y elimina esta nota.

---

## Contexto de negocio

{1-2 párrafos: qué problema resuelve esta pantalla/feature, para qué rol está pensada, en qué punto del flujo de trabajo aparece. Si aplica, qué regla del producto está implementando (ej: declaración trimestral CCFLEX, observabilidad de licencias underused, etc).}

## User stories (formato EARS)

- **WHEN** {condición concreta y observable} **THEN** {comportamiento esperado}
- **IF** {estado del sistema} **THEN** {restricción que debe cumplirse}
- **WHILE** {proceso en curso} **THEN** {invariante que se mantiene}

Ejemplos:

- WHEN el usuario AVVALE_KAM entra en `/sap-licensing/customers` THEN ve un listado paginado de sus clientes asignados
- IF el cliente ya existe con el mismo `taxId` THEN el formulario de creación muestra error "Ya existe un cliente con ese NIF"
- WHILE se está cargando la lista THEN se muestra el skeleton del DataTable

## Criterios de aceptación

- [ ] Criterio observable 1 (lo que el usuario puede ver/hacer)
- [ ] Criterio observable 2
- [ ] ...

## Referencias (proyecto de referencia y diseño)

- `docs/referencia/libs/{ruta-al-módulo-o-patrón-de-oro}`
- Documento de diseño: `docs/{documento}.md` §{NN}

## Reglas de negocio aplicables

- {regla del steering/product.md o de los ADRs de docs/, citando la sección}
- Ej: "Umbrales de licencia definidos en `license-thresholds.constants.ts` — `underused < 40%`, `healthy 40-95%`, `overused > 95%`, `breach > 100%`"

## Fuera de scope (deliberado)

- {qué NO se implementa en esta spec — para evitar scope creep}
- Ej: "Subida real de evidencias — solo se persisten metadatos (filename, mimeType, sizeBytes, storageKey)"

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación explícita del usuario.

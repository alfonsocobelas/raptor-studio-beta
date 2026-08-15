# Diseño técnico: Convergencia flujos↔transiciones

_Acordada en el brainstorming de la spec 43 (2026-08-14/15). Regla de oro: **endpoint solo
donde hay cuerpo real** — nunca fachadas sobre huecos vacíos._

## 0. Qué converge

```
  paso del flujo                        qué se emite (spec 39 → esta spec)
  ─────────────────────────────────    ─────────────────────────────────────
  con entity + transition               cuerpo REAL determinista (cargar →
                                        entidad.verbo() → guardar) y AHORA SÍ
                                        su endpoint POST /processes/…/:id
  con entity sin transition             hueco @ai como hoy, SIN endpoint
  sin entity / decision / start / end   como hoy: documentación
```

La guarda vive en el VERBO del agregado (spec 43): el paso no la duplica. Un 409 del
endpoint de proceso es la misma `InvalidTransitionError` mapeada por el filtro global.

## 1. Estudio

- **Panel del paso** (pestaña del nodo en el modo Flujos): si el paso alude a una entidad
  con máquina, un desplegable «Transición» con los verbos de la máquina («— ninguna —» la
  quita; el patch deja el campo fuera, como `entity`). Sin máquina, no se ofrece.
- **Canvas**: el nodo con `transition` enseña el verbo (etiqueta pequeña junto al texto,
  mismo tratamiento que la alusión a entidad).
- **Store**: `updateFlowNode` ya patchea campos del nodo; `transition` viaja igual. El gate
  del store es permisivo (forma en `validateFlows`); la existencia contra la máquina la
  valida la frontera (hecho en la 43).
- **Chat**: el prompt aprende a declarar `transition` en pasos que ejecutan un verbo de la
  máquina de su entidad (y a NO inventarla si el paso no es un verbo); el schema de salida
  admite el campo.

⚠️ Los ficheros `flow-view/flow-panel/flow-sidebar` llevan WIP de Alfonso sin commitear:
antes de tocarlos, revisar el estado y no arrastrar su WIP a los commits de la spec.

## 2. Emisión (flow-process.ts + plantillas)

- **Cuerpo del paso con `transition`** (autosuficiente, doctrina spec 39 — sin hueco @ai):

```ts
/** Paso 3 — Se aprueba el presupuesto · transición «Aprobar» de instalacion. */
async aprueba(id: InstalacionId): Promise<void> {
  const instalacion = await this.instalacionRepository.get(id)
  if (!instalacion) {
    throw new EntityNotFoundError('Instalacion', id.value)
  }
  instalacion.aprobar()
  await this.instalacionRepository.save(instalacion)
}
```

  Mismo cuerpo de tres líneas que el use case de la transición; se emite inline porque el
  proceso ya inyecta los repositorios y los módulos NO exportan sus use cases (la DI
  cruzada iría contra el wiring actual). El JSDoc del paso añade la línea de la transición.

- **Controller de procesos**: `files-flow-process/` gana
  `__flowFileName__.controller.ts.template` — un controller por flujo, SOLO si algún paso
  declara `transition`, con una ruta por paso convergido:

```ts
@Controller('processes/de-presupuesto-a-legalizacion')
export class DePresupuestoALegalizacionController {
  @Post('aprueba/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  aprueba(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.process.aprueba(InstalacionId.create(id))
  }
}
```

- **processes.module.ts**: `controllers: [...]` con los controllers de los flujos que los
  tengan. Sin pasos convergidos en ningún flujo → módulo como hoy, sin controllers.
- **Huecos**: los pasos convergidos NO llevan `@ai:begin flow-<id>` (no hay nada que
  rellenar); el harvest/reinyección de los demás no cambia.

## 3. Oro

El flujo de la app golden («Del contrato al proyecto implantado») gana `transition` en un
paso: el candidato natural es un paso nuevo o existente sobre `contract` con la máquina de
la 43 (`terminate`). Se añade el paso «Se termina el contrato» (step, entity contract,
transition terminate) colgado de la rama adecuada — así el oro congela cuerpo + controller
+ módulo. `/golden-diff` en cada tarea de plantillas.

## 4. Validación

Suite completa + `web:build` + `/golden-diff` + navegador: declarar la transición en el
panel del paso, generar, y ejercitar `POST /processes/<flujo>/<paso>/:id` contra la app
corriendo (Docker ya disponible): 204 y transición aplicada, 409 desde estado ilegal.

## Decisiones técnicas

| Decisión                          | Elegida                                | Razón                                                |
| --------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Cuerpo del paso convergido        | inline (cargar→verbo→guardar)          | el proceso ya inyecta repos; los módulos no exportan use cases |
| Endpoint                          | solo pasos con `transition`            | nunca fachadas sobre huecos vacíos                    |
| Guarda                            | en el verbo del agregado (43)          | una sola fuente; el 409 sale del filtro global        |
| Relleno @ai como fase de la obra  | FUERA (spec propia)                    | fontanería del estudio/bridge, no de la emisión       |
| Vocabulario                       | solo `transition`                      | crece verbo a verbo, regla de los dos (doctrina §9)   |

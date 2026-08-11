import type { FlowNodeKind } from '@acc/schema'

/**
 * Cómo se llaman los bloques EN PANTALLA (nomenclatura acordada 2026-08-11). El contrato
 * sigue diciendo `start | step | decision | end`: esto es el idioma del usuario, y vive en
 * un solo sitio para que el raíl, el lienzo y el inspector no se contradigan entre ellos.
 *
 * **Disparador**, no «inicio»: un proceso de negocio no empieza, algo lo DISPARA —cambia
 * una fila, llega una fecha, alguien pulsa—. Que sea la primera caja ya lo dice el dibujo;
 * lo que hace falta saber es qué lo pone en marcha. Es también como lo llama la referencia.
 *
 * **Condición**, no «decisión»: lo que se escribe dentro del rombo es una condición
 * («stock < 10»), no una pregunta ni una decisión. Decidir es lo que hacen las RAMAS, y de
 * eso ya hablan sus etiquetas sí/no. El usuario nombra el contenido, no el mecanismo.
 */
export const FLOW_KIND_LABELS: Record<FlowNodeKind, string> = {
  start: 'disparador',
  step: 'paso',
  decision: 'condición',
  end: 'fin'
}

/** Texto con el que nace cada bloque; es un hueco a rellenar, no un nombre definitivo. */
export const FLOW_KIND_STARTERS: Record<FlowNodeKind, string> = {
  start: 'Cuando…',
  step: 'Nuevo paso',
  decision: 'campo = valor',
  end: 'Fin'
}

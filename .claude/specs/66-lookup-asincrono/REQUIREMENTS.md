# Spec 66: Lookup con búsqueda asíncrona (combobox typeahead)

## Contexto

Los campos de referencia (mascota, dueño…) se emiten como `app-select` alimentado por la
lectura PAGINADA compartida del recurso destino: con datos reales solo ofrece la página
actual (10) y con miles de registros un desplegable es inviable. Detectado en la demo
veterinaria (2026-08-25).

## User stories (EARS)

- WHEN el usuario teclea en un campo de referencia THEN se buscan (con debounce) hasta 20
  resultados por el endpoint de búsqueda existente del recurso destino y se eligen de una
  lista; el valor guardado sigue siendo el id.
- WHEN se edita un registro THEN el campo muestra la etiqueta del referenciado actual
  (resuelta por `findOne` del destino), no un input vacío.
- WHEN el destino tiene menos resultados que el tope THEN el foco sin término ya ofrece la
  primera página (comportamiento actual conservado para conjuntos pequeños).

## Criterios de aceptación

- [ ] Componente compartido `app-lookup` (CVA, valor id) en el kernel: input + lista de
      resultados + debounce, sin dependencia del select de Spartan.
- [ ] Servicio emitido: `lookup(term)` con petición PROPIA (page 1, pageSize 20) que no toca
      el estado compartido; `findOne` pasa a emitirse siempre.
- [ ] Diálogo y página-formulario: los campos con `lookup` usan `app-lookup`; al editar se
      siembra la opción del id actual.
- [ ] Golden re-baseline deliberado (cambian service, diálogo y form-page de los módulos con
      referencias) revisado a mano.
- [ ] Demo veterinaria regenerada: buscar una mascota por nombre en el alta de cita funciona.

## Alcance

Generador solamente (kernel UI + plantillas resource). El estudio no cambia (el preview del
canvas sigue enseñando un desplegable: es maqueta).

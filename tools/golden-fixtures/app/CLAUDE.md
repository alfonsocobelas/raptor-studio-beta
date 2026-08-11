# app-golden — contexto del negocio

> Destilado de la conversación de diseño en el estudio. Corrige aquí lo que cambie:
> este fichero es la memoria del negocio que acompaña al código generado.

## Negocio

Gestión de licencias SAP para clientes corporativos: contratos con su vigencia y los proyectos de implantación asociados. Es la app de oro del acelerador: su composición ejercita período, lookups, borrado y dashboard.

## Reglas

- Un contrato no puede terminar antes de empezar
- El número de contrato es único cuando existe (los de maintenance pueden no traerlo)

## Glosario

- **vigencia**: el período entre la fecha de inicio y la de fin del contrato

## Entidades

- **Contrato**: Un contrato de licencias con un cliente; su vigencia gobierna qué licencias están activas.
- **Proyecto**: Un proyecto de implantación para un cliente; las oleadas las rellena el sync, no el alta.

## Procesos de negocio

### Del contrato al proyecto implantado

El recorrido de una venta desde que se firma el contrato hasta que el proyecto queda implantado.

1. (inicio) El cliente pide una implantación
2. Se firma el contrato con su vigencia · entidad: contract
3. ¿El comité aprueba el alcance?
   - no → 4
   - sí → 5
4. (fin) Petición descartada
5. Se abre el proyecto de implantación · entidad: project
6. ¿Hay desvío sobre el alcance?
   - sí → 7
   - no → 8
7. Se negocia una ampliación de alcance
   - → 5
8. (fin) Proyecto implantado

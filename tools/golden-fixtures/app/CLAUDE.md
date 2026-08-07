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

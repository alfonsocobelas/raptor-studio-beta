# app-mongo-golden — contexto del negocio

> Destilado de la conversación de diseño en el estudio. Corrige aquí lo que cambie:
> este fichero es la memoria del negocio que acompaña al código generado.

## Negocio

Gestión de licencias SAP sobre MongoDB: clientes con sus contactos, contratos con su vigencia y las licencias que consumen. Es la app de oro del motor mongo: congela los documentos embebidos, las agregaciones y el tablero por transición.

## Reglas

- Un contrato no puede terminar antes de empezar
- Una licencia borrada no vuelve a listarse (borrado suave)

## Glosario

- **vigencia**: el período entre la fecha de inicio y la de fin del contrato

## Entidades

- **Contrato**: Un contrato de licencias con un cliente; su vigencia gobierna qué licencias están activas.

## Procesos de negocio

### Del alta del cliente al contrato terminado

El recorrido desde que se da de alta el cliente hasta que su contrato se termina.

1. (inicio) Llega un cliente nuevo
2. Se da de alta el cliente con sus contactos · entidad: customer
3. Se firma el contrato con su vigencia · entidad: contract
4. ¿El cliente renueva?
   - no → 5
   - sí → 7
5. Se termina el contrato · entidad: contract
6. (fin) Contrato terminado
7. (fin) Contrato en vigor

# Proyecto generado por el acelerador

Estructura canónica (la misma del proyecto de referencia):

```
apps/backend-api      arranque de la API NestJS
apps/frontend-app     aplicación Angular (shell + rutas)
libs/backend          kernel + un módulo por recurso (dominio, aplicación, infraestructura)
libs/frontend         kernel Angular + una feature por recurso
libs/shared/domain    DTOs compartidos front/back
libs/ui               componentes Spartan (materializados con @spartan-ng/cli)
```

## Arranque local

```bash
make local-setup      # postgres + npm install + seed
make api              # http://localhost:3000/api/v1
make web              # http://localhost:4200
```

Sin Docker: ajusta la conexión en
`libs/backend/src/contexts/shared/infrastructure/config/environments/local.json`.

## Regeneración

Todo `libs/backend`, `libs/frontend` y `libs/shared` sale de los modelos del registro:
para cambiar un campo, edita el modelo y vuelve a generar. Lo escrito entre
`// @ai:begin` y `// @ai:end` (por ejemplo las filas de seed realistas) sobrevive.

Para añadir más componentes Spartan: `npm run ui:add -- <nombre>`.

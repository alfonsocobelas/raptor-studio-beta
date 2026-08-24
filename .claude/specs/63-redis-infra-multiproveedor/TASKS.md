# Tareas atómicas: Redis para sesiones en todos los proveedores de infra

> Cada tarea = un commit. TDD: test rojo primero en `redis-session.plugin.spec.ts` /
> `session-store.spec.ts`. Gate de oro antes de cada commit (toca el plugin).

- [x] TASK-01: `PluginContext.infra` + threading desde `app.ts`; `addCloudRedis` decide por
      `context.infra` (azure conserva su comportamiento; test de que sin `key-vault.tf`
      pero `infra=azure` sigue emitiendo — muerte del sniffing). Actualizar contextos de
      los tests existentes.
- [x] TASK-02: entornos dev/qa/prod por proveedor (azure 10000/tls, aws 6379/tls,
      raptor 6379/sin tls).
- [x] TASK-03: aws — `iac/elasticache.tf` inline + secretos redis-host/redis-password +
      patch del statement ReadSecrets en `iam.tf`; desaparece la nota de pendiente en aws.
- [x] TASK-04: raptor — servicio redis en `docker-compose.prod.yml` (requirepass,
      noeviction, depends_on, cabecera del .env) + sección en `iac/README.md`; desaparece
      la nota de pendiente en raptor.
- [x] TASK-05: test de degradación con `--provisionedInfra` (sin `iac/`, el plugin no
      escribe nada ni falla) + suite del generador completa + `/golden-diff` limpio.

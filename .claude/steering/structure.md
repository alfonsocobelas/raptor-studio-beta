# Estructura del repo — Acelerador

> Actualizado 2026-07-31. El workspace está COMPLETO: 5 generadores + catálogo de infra
> + IaC en 3 proveedores + apps demo. El gate de oro (`npm run golden:diff`) valida el
> generador `resource` contra 4 módulos congelados.

## Vista general (real)

```
acelerador/
├── .claude/                       # Arnés (constitución, skills, specs, steering)
├── .github/workflows/release.yml  # nx release → GitHub Packages (gateado por suite+oro)
├── docs/                          # Documentos de diseño (maestro + ADRs) + PUBLISHING.md
│   └── referencia/                # ⚠️ copia de sap-licenses (gitignored, credenciales)
├── apps/                          # Demos anidadas (workspaces propios, fuera del grafo padre)
│   ├── almacen/  concesionario/   #   verificación end-to-end del código emitido
├── libs/
│   ├── schema/                    # defineResource + tipos (TS puro, sin frameworks)
│   ├── generators/                # Plugin Nx @acc/generators — 5 generadores:
│   │   └── src/generators/
│   │       ├── resource/          #   modelo → módulo completo (~50 ficheros/recurso)
│   │       │   ├── models/        #   registro de modelos (registry.ts + *.model.ts)
│   │       │   ├── build-*.ts     #   LA LÓGICA (substitutions/aggregate/composition/
│   │       │   │                  #   application/entrypoints/tests) — regla #8
│   │       │   ├── ai-slots.ts    #   huecos // @ai:begin…end que sobreviven a regenerar
│   │       │   └── files*/        #   plantillas EJS por capa (vo/uspec/application/
│   │       │                      #   entrypoints/module/seed/composition*/tests)
│   │       ├── kernel/            #   kernel backend compartido (copy-once, ~80 ficheros)
│   │       ├── frontend-kernel/   #   kernel Angular (DataTable, guards, interceptors; ui skins)
│   │       ├── shared-domain/     #   lib DTOs front⇄back derivada del registro
│   │       └── root/              #   composition root (root.module + main + environments)
│   └── infra/                     # Catálogo de adapters (ADR-004) — paquetes @acc/infra-*:
│       ├── ports/                 #   puertos abstractos + contratos estructurales
│       ├── storage-{azure,s3,gcs} #   FileStoragePort (conformidad real: Azurite/MinIO)
│       ├── config-{azure,aws}     #   resolución vault.* (Key Vault / Secrets Manager)
│       ├── secrets/               #   Azure KV·AWS·GCP·Doppler·Infisical·Bitwarden
│       ├── observability-{azure,sentry} + metrics-prometheus
│       ├── auth/                  #   argon2, tokens, tenant resolvers, login social
│       │                          #   (Google/Microsoft OIDC, GitHub OAuth)
│       └── session-redis/         #   SessionStore con TTL + índice por usuario
├── iac/                           # Terraform por proveedor (espejo componente a componente)
│   ├── azure/  aws/  gcp/         #   los 3 validan con terraform validate
├── tools/
│   ├── golden-fixtures/           # ⚠️ fixtures congeladas — NUNCA editar a mano
│   └── golden-diff.sh             # gate: regenera y exige diff vacío (exit code)
└── docker/ + Makefile             # postgres/azurite/minio + conformance
```

## Estructura del módulo EMITIDO por `resource`

Espeja la referencia (`contexts/{context}/modules/{module}/`):

```
{module}/
├── domain/            # agregado (+hijo si composition), VOs, errors, constants,
│                      # repository (port), specifications (with-id + por unique)
├── application/       # use-cases (get/search/export/register/update/remove + CRUD hijo),
│                      # handlers 1:1, dtos, config/search-{entity}-config
├── infrastructure/
│   ├── entrypoints/   # controller REST (+ controller hijo), DTOs class-validator,
│   │                  # export-columns, export-query dto
│   ├── persistence/typeorm/  # entity (+hija), mapper, repository (hydrate/orphan-diff)
│   └── seed/          # seeder idempotente + fixtures derivadas (NODE_ENV=local)
├── {module}.module.ts # wiring NestJS completo
└── frontend/          # list, dialog, service (+spec), mocks
```

Los puntos NO deterministas llevan huecos `// @ai:begin <id> … // @ai:end`
(domain-extra, port-extra, repository-extra, mapper-extra, list-extra,
service-extra, seed-data): lo escrito dentro sobrevive a la regeneración.

## Reglas de estructura — inamovibles

1. **`libs/schema` es TypeScript puro**: prohibido `@nestjs/*`, `@angular/*`, `typeorm`, `ejs`, `@nx/devkit`.
2. **Las plantillas no mencionan entidades concretas**: solo huecos. Si una plantilla dice "customer", está mal.
3. **`tools/golden-fixtures/` es de solo lectura**: re-baseline deliberado, nunca ediciones manuales.
4. **Plantillas de features no importan la librería UI directamente** (ADR-003 Nivel 1): emiten contra componentes shared; la skin (spartan/material) la decide `frontend-kernel --ui`.
5. **Plantillas de domain no emiten imports de framework**.
6. **Barrel único por lib**; dentro de la lib, imports directos al fichero.
7. **El gate se corta por exit code** (`npm run golden:diff; echo $?`), nunca por grep de la salida.

## Naming (idéntico a la referencia)

Ficheros kebab-case, clases PascalCase, `{Acción}{Entidad}UseCase`, `TypeOrm{Entity}Repository`, `{Entidad}Mother/Builder/RepositoryMock`, tests `.test.ts` (back) / `.spec.ts` (front).

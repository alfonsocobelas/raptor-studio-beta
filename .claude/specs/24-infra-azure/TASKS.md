# Tareas atómicas: proveedor `infra=azure`

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde antes de cada commit (el re-baseline de `app` es TASK-07).

---

## Base honesta (el bug primero)

- [ ] **TASK-01**: El logger base deja de llamarse Azure y de traer el transporte OTel:
      `logger/azure/azure-logger.service.ts` → `logger/app-logger.service.ts` (winston a stdout,
      JSON en dev/prod y legible en local/test). El transporte OTel sale a un fichero aparte que
      hoy no se emite. Golden de app con diff **esperado** en el logger → se congela en TASK-07;
      hasta entonces el gate de app queda rojo a propósito y se anota en cada commit.
- [ ] **TASK-02**: Fuera del kernel base los loaders `config/loaders/azure/` y
      `storage/azure-blob-file-storage.ts`. `config-sources.ts` se queda con JSON por entorno +
      variables de entorno. Test: el árbol emitido sin infra no importa `@azure/*`.

## Ranura y proveedor

- [ ] **TASK-03**: Tests + tipo `InfraProvider` y proveedor `none`; la ranura `infra` pasa a
      resolverse por manifiesto (hoy sólo declara el valor). Sin cambio de salida.
- [ ] **TASK-04**: Proveedor `azure`: subárbol `files-infra-azure` con los loaders de Key Vault +
      las cuatro dependencias `@azure/*` declaradas + secciones de config (`vault`, `storage.azure`,
      `applicationInsights`). `--infra` aparece en `schema.json` (su test de paridad lo exige) y en
      `slots.json`.
- [ ] **TASK-05**: Telemetría en el proveedor: `instrument.ts`/`init-telemetry.ts` y el `apply()` que
      los pone como primer import de `main.ts`. `observability` sale de `PLUGINS` y
      `--plugins=observability` mapea a `--infra=azure` con aviso de deprecación.
- [ ] **TASK-06**: Storage: el proveedor emite `azure-blob-file-storage.ts` y su `apply()` enlaza el
      adapter en el `StorageModule` **por sección de config** (`storage.azure` presente → Blob; si no,
      disco local), igual que ya hace el plugin de email.

## Cierre

- [ ] **TASK-07**: Re-baseline de la fixture de app como "todo encendido"
      (`--plugins=auth,email --infra=azure`), revisión del diff a mano, y commit propio
      `chore(golden): …`. Los 6 gates en verde.
- [ ] **TASK-08**: Verificación que el golden NO puede dar: generar una app sin infra y una app azure
      **fuera del árbol del acelerador**, `npm install` + `tsc` en ambas. Es el único sitio donde se
      ve el fallo que motiva la spec (dentro del monorepo el hoisting lo tapa). Anotar el resultado
      en esta spec y, si procede, proponer el gate automatizado en el ROADMAP.

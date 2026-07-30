# Diseño técnico: Golden fixtures y gate

- **Layout**: `tools/golden-fixtures/<plural>/{backend,frontend}/…`. `backend/` espeja la raíz del
  módulo Nest de referencia; `frontend/` espeja la feature Angular. El generador emite con el mismo
  prefijo (`files/backend/…` → `tmp/generated/<plural>/backend/…`).
- **Gate**: `tools/golden-diff.sh` — para cada modelo registrado: regenerar a `tmp/generated/<plural>`
  y `diff -u` **de cada fichero generado** contra su homólogo en la fixture. Cobertura = lo generado
  (los ficheros de fixture sin plantilla aún no cuentan como fallo). Reporte por entidad + exit ≠ 0 si
  algún diff o si falta el homólogo.
- **Baseline inicial**: copia verbatim (`cp -R`) desde `docs/referencia` (misma config de prettier).
  El guard de hooks sigue bloqueando Write/Edit sobre las fixtures; el baseline/re-baseline va por Bash
  con commit propio `chore(golden): …`.
- **Lista de modelos**: la mantiene el script (hoy: `contract`). Cuando exista registro dinámico se
  derivará de `MODELS`.

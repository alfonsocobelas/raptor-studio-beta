#!/usr/bin/env bash
# Gate de oro: regenera cada modelo registrado y compara CADA fichero generado
# contra su homólogo en tools/golden-fixtures/<plural>/.
# Cobertura incremental: los ficheros de fixture sin plantilla aún no fallan.
set -uo pipefail

MODELS=("contract:contracts" "customer:customers" "license:licenses" "project:projects")   # <name>:<plural> — crece con los modelos registrados
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Área de trabajo ÚNICA por ejecución: dos gates concurrentes (sesiones paralelas) se pisaban
# el rm -rf y reportaban "generación falló" falsos. PID basta: no hay dos runs con el mismo.
RUN_REL="tmp/generated-$$"
OUT="$ROOT/$RUN_REL"
DIFF_OUT="$OUT/.golden-diff-out"
FIX="$ROOT/tools/golden-fixtures"
failures=0
summary=""
SKIP_LIST="$ROOT/tools/golden-skip.txt"
trap 'rm -rf "$OUT"' EXIT

# ¿Está esta ruta declarada como no comparable para esta fixture? (ver tools/golden-skip.txt)
is_skipped() {                     # <fixture> <ruta relativa>
  [[ -f "$SKIP_LIST" ]] || return 1
  grep -v '^#' "$SKIP_LIST" | grep -qF "$1|$2|"
}

rm -rf "$OUT" && mkdir -p "$OUT"
for entry in "${MODELS[@]}"; do
  name="${entry%%:*}"; plural="${entry##*:}"
  if ! npx nx generate @raptor/generators:resource "$name" --directory="$RUN_REL/$plural" >/dev/null 2>&1; then
    summary+=" $name: ❌ generación falló |"; failures=$((failures+1)); continue
  fi
  entity_fail=0; covered=0
  while IFS= read -r -d '' file; do
    rel="${file#"$OUT/$plural/"}"
    covered=$((covered+1))
    if is_skipped "$plural" "$rel"; then
      continue
    fi
    if [[ ! -f "$FIX/$plural/$rel" ]]; then
      echo "❌ $name: sin homólogo en fixture: $rel"; entity_fail=1; continue
    fi
    if ! diff -u "$FIX/$plural/$rel" "$file" > "$DIFF_OUT" 2>&1; then
      echo "❌ $name: diff en $rel"; cat "$DIFF_OUT"; entity_fail=1
    fi
  done < <(find "$OUT/$plural" -type f -print0)
  if [[ $entity_fail -eq 0 ]]; then
    summary+=" $name: ✅ vacío ($covered ficheros) |"
  else
    summary+=" $name: ❌ con diffs |"; failures=$((failures+1))
  fi
done

# ── Gate del generador de APP ────────────────────────────────────────────────
# La capa de composición (esqueleto, plugins, recolocaciones, cableado del root)
# no la cubren los módulos: se genera una app canónica completa y se compara.
# Un gate por MOTOR de persistencia: el mismo pipeline emite árboles distintos y
# el golden postgres no ve nada de lo que emite mongo (ni al revés).
# skipInstall: el gate no toca la red.
gate_app() {                       # <etiqueta> <nombre-app> <dir-fixture> <args del generador…>
  local label="$1"; shift
  local app="$1"; shift
  local fixture="$1"; shift
  local out="$OUT/$app"

  if ! NX_PREFER_NODE_STRIP_TYPES=false npx nx generate @raptor/generators:app "$app" \
        "$@" --directory="$RUN_REL/$app" --skipInstall --no-interactive >/dev/null 2>&1; then
    summary+=" $label: ❌ generación falló |"; failures=$((failures+1)); return
  fi

  local app_fail=0 covered=0 rel
  while IFS= read -r -d '' file; do
    rel="${file#"$out/"}"
    covered=$((covered+1))
    if is_skipped "$fixture" "$rel"; then
      continue
    fi
    if [[ ! -f "$FIX/$fixture/$rel" ]]; then
      echo "❌ $label: sin homólogo en fixture: $rel"; app_fail=1; continue
    fi
    if ! diff -u "$FIX/$fixture/$rel" "$file" > "$DIFF_OUT" 2>&1; then
      echo "❌ $label: diff en $rel"; cat "$DIFF_OUT"; app_fail=1
    fi
  done < <(find "$out" -type f -print0)

  # un fichero congelado que el generador ya no emite también es una regresión
  while IFS= read -r -d '' fixed; do
    rel="${fixed#"$FIX/$fixture/"}"
    if [[ ! -f "$out/$rel" ]] && ! is_skipped "$fixture" "$rel"; then
      echo "❌ $label: la fixture tiene un fichero que ya no se emite: $rel"; app_fail=1
    fi
  done < <(find "$FIX/$fixture" -type f -print0)

  if [[ $app_fail -eq 0 ]]; then
    summary+=" $label: ✅ vacío ($covered ficheros) |"
  else
    summary+=" $label: ❌ con diffs |"; failures=$((failures+1))
  fi
}

# postgres: la app "todo encendido" — contract+project ejercitan composición, período, lookups y
# delete; auth viene de fábrica (spec 58), email como plugin, infra=azure como proveedor
# la composición viene del app-schema registrado 'golden' (misma que las opciones planas
# equivalentes) para que lleve BRIEF: la fixture congela también el CLAUDE.md (spec 22)
gate_app "app" "app-golden" "app" --app=golden --ui=spartan --plugins=email --infra=azure

# mongo: el app-schema golden-mongo (spec 76) — espejo del feature-set de golden sobre los
# modelos que el motor puede honrar: customer (composición embebida + índice parcial),
# contract (period, transiciones, kanban, medidas) y license (softDelete). Sin project:
# lleva adjuntos, que emiten TypeORM y mongo los rechaza antes de emitir (spec 25).
# El schema ejercita lo que el gate plano no vigilaba: kpi-row (73), aggregate (71),
# agregación agrupada (72) y el flujo con paso de transición (44).
# infra=none (interno) fijado a propósito: este gate vigila mongo, no la infra — con el
# default raptor (2026-08-24) la fixture se llenaría de adapters que ya gata la app postgres
gate_app "app-mongo" "app-mongo-golden" "app-mongo" --app=golden-mongo --database=mongo --infra=none

echo
echo "🏅 Golden diff —$summary"
[[ $failures -eq 0 ]] && echo "Veredicto: apto para commit" || echo "Veredicto: NO commitear hasta vaciar los diffs"
exit $failures

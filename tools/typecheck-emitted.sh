#!/usr/bin/env bash
# Gate de compilación del CÓDIGO EMITIDO. El golden compara ficheros y la suite del plugin no
# compila lo que emite, así que esta clase de fallo (un import roto, una dependencia que el
# emitido usa pero no declara) sobrevive a ambos. Ha pasado dos veces: los defectos de 5232994 y
# el renombre del logger de la spec 24, que dejó TODAS las apps sin compilar.
#
# Se genera FUERA del árbol del acelerador a propósito: dentro, el node_modules del monorepo
# resuelve por hoisting lo que el package.json emitido no declara y el fallo no aparece.
#
# Lento (~2 min por app): no va en el golden de cada commit. Se corre al cerrar una spec y en CI.
#
# Con --suite, además de compilar EJECUTA las suites del emitido (jest unit + vitest front; la
# integración queda fuera: exige base de datos). Nació de la revisión de las specs 70-72: el spec
# frontend del panel se congeló EN ROJO en el oro porque compilaba de sobra — ningún gate lo
# ejecutaba. Un test emitido que no se corre nunca no es un test: es un fichero con aspecto de test.
#
#   bash tools/typecheck-emitted.sh                      # la app de oro (spec 27: debe dar 0 errores)
#   bash tools/typecheck-emitted.sh --suite              # la app de oro, compilada Y con sus suites
#   bash tools/typecheck-emitted.sh --app=boutique --infra=azure
#   bash tools/typecheck-emitted.sh --models=customer,contract,license,project
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SUITE=0
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--suite" ]]; then RUN_SUITE=1; else ARGS+=("$arg"); fi
done
# por defecto se mide la app de ORO: los cuatro módulos del canon ejercitan todos los kind de VO
# compartido, el período, la composición y los uniques — es donde los 49 errores vivían (spec 27)
[[ ${#ARGS[@]} -eq 0 ]] && ARGS=(--models=customer,contract,license,project)

NAME="typecheck-emitted"
STAGING="$ROOT/tmp/$NAME"
OUTSIDE="$(mktemp -d "${TMPDIR:-/tmp}/acc-emitted-XXXXXX")"

cleanup() {
  rm -rf "$OUTSIDE"
  rm -rf "$STAGING"
}
trap cleanup EXIT

echo "▶ generando app emitida (${ARGS[*]})"
rm -rf "$STAGING"
if ! (cd "$ROOT" && NX_PREFER_NODE_STRIP_TYPES=false npx nx generate @raptor/generators:app "$NAME" \
      "${ARGS[@]}" --directory="tmp/$NAME" --skipInstall --no-interactive >/dev/null 2>&1); then
  echo "❌ la generación falló"
  exit 1
fi

# fuera del árbol: es lo único que revela las dependencias no declaradas
APP="$OUTSIDE/app"
mv "$STAGING" "$APP"

echo "▶ npm install fuera del monorepo ($APP)"
if ! (cd "$APP" && npm install --no-audit --no-fund >"$OUTSIDE/install.log" 2>&1); then
  echo "❌ npm install falló; últimas líneas:"
  tail -20 "$OUTSIDE/install.log"
  exit 1
fi

echo "▶ tsc --noEmit (backend + shared)"
(cd "$APP" && npx tsc -p tsconfig.json --noEmit > "$OUTSIDE/tsc.log" 2>&1)

# El tsconfig raíz solo incluye backend+shared: los dialogs rotos (TS2693/TS2307 de la
# spec 04) dieron «0 errores» dos días. El frontend se mide con SU tsconfig (lib dom).
echo "▶ tsc --noEmit (frontend)"
(cd "$APP" && npx tsc -p apps/frontend-app/tsconfig.app.json --noEmit >> "$OUTSIDE/tsc.log" 2>&1)

errors=$(grep -c "error TS" "$OUTSIDE/tsc.log" || true)

if [[ "$errors" -gt 0 ]]; then
  echo
  echo "❌ $errors error(es) de TypeScript en el código emitido:"
  grep "error TS" "$OUTSIDE/tsc.log"
  echo
  echo "Resumen por tipo de error:"
  grep "error TS" "$OUTSIDE/tsc.log" | sed 's/.*error \(TS[0-9]*\).*/\1/' | sort | uniq -c | sort -rn
  exit 1
fi

echo "🏅 el código emitido compila fuera del acelerador: 0 errores"
[[ "$RUN_SUITE" -eq 0 ]] && exit 0

# ── --suite: las suites del emitido se EJECUTAN, no solo se compilan ─────────────────────────
# La unit del backend corre con dobles (sin base de datos); la de integración exige postgres o
# mongo y queda fuera: es la deuda que solo una demo con datos paga.
suite_fail=0

echo "▶ suite backend (jest unit)"
if ! (cd "$APP" && NODE_ENV=test npx jest --selectProjects unit > "$OUTSIDE/jest.log" 2>&1); then
  suite_fail=1
  echo "❌ la suite unit del backend emitido falla; últimas líneas:"
  tail -30 "$OUTSIDE/jest.log"
else
  grep -E "^Tests:" "$OUTSIDE/jest.log" | tail -1
fi

echo "▶ suite frontend (vitest)"
if ! (cd "$APP" && npx vitest run > "$OUTSIDE/vitest.log" 2>&1); then
  suite_fail=1
  echo "❌ la suite frontend emitida falla; últimas líneas:"
  tail -40 "$OUTSIDE/vitest.log"
else
  grep -E "Tests  " "$OUTSIDE/vitest.log" | tail -1
fi

if [[ "$suite_fail" -ne 0 ]]; then
  echo "❌ el emitido compila pero sus suites NO pasan"
  exit 1
fi

echo "🏅 las suites del emitido pasan fuera del acelerador"
exit 0

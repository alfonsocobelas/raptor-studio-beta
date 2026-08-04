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
#   bash tools/typecheck-emitted.sh                      # app de demo (boutique)
#   bash tools/typecheck-emitted.sh --app=boutique --infra=azure
#   bash tools/typecheck-emitted.sh --models=customer,contract,license,project
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARGS=("$@")
[[ ${#ARGS[@]} -eq 0 ]] && ARGS=(--app=boutique)

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
if ! (cd "$ROOT" && NX_PREFER_NODE_STRIP_TYPES=false npx nx generate @acc/generators:app "$NAME" \
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

echo "▶ tsc --noEmit"
(cd "$APP" && npx tsc -p tsconfig.json --noEmit > "$OUTSIDE/tsc.log" 2>&1)
errors=$(grep -c "error TS" "$OUTSIDE/tsc.log" || true)

if [[ "$errors" -eq 0 ]]; then
  echo "🏅 el código emitido compila fuera del acelerador: 0 errores"
  exit 0
fi

echo
echo "❌ $errors error(es) de TypeScript en el código emitido:"
grep "error TS" "$OUTSIDE/tsc.log"
echo
echo "Resumen por tipo de error:"
grep "error TS" "$OUTSIDE/tsc.log" | sed 's/.*error \(TS[0-9]*\).*/\1/' | sort | uniq -c | sort -rn
exit 1

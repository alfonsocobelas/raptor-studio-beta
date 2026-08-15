import { initTelemetry } from './init-telemetry'

// Side-effect entry: the generated app's main.ts must import this file BEFORE any other
// application code (`import '@raptor/infra-observability-azure/instrument'` as the very first
// import) so Azure Monitor sets up the global OpenTelemetry providers early.
// NOT re-exported from the barrel on purpose: importing the barrel must never trigger it.
try {
  initTelemetry()
} catch (error) {
  // Fail fast with a readable cause: this runs as the first module of the bundle, so an
  // uncaught throw here makes Node dump the whole minified bundle instead of the reason.
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

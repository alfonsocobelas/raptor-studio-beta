import { initTelemetry } from './init-telemetry'

// Side-effect entry: must be imported before any other application code (the very first
// import in main.ts) so Azure Monitor sets up the global OpenTelemetry providers early.
try {
  initTelemetry()
} catch (error) {
  // Fail fast with a readable cause: this runs as the first module of the bundle, so an
  // uncaught throw here makes Node dump the whole minified bundle instead of the reason.
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

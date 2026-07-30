export * from './lib/azure-logger'
export * from './lib/init-telemetry'
// instrument.ts NO se re-exporta: es entrada de side-effect (primer import del main.ts)

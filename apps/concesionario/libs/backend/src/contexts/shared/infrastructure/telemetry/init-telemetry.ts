import { useAzureMonitor } from '@azure/monitor-opentelemetry'
import { TelemetryInitError } from '../../domain/errors'

// Azure Monitor (Application Insights) only ships from deployed environments.
// In local/test the OpenTelemetry log transport is a no-op, so logs stay in stdout.
const MONITORED_ENVS = ['dev', 'prod']

export function initTelemetry(): 'enabled' | 'disabled' {
  const env = process.env['NODE_ENV']
  const connectionString = process.env['APPLICATIONINSIGHTS_CONNECTION_STRING']

  if (!env || !MONITORED_ENVS.includes(env)) {
    console.log(`--- [Telemetry] Azure Monitor disabled (NODE_ENV=${env ?? 'undefined'}) ---`)
    return 'disabled'
  }

  if (!connectionString) {
    throw new TelemetryInitError('Application Insights connection string is not defined')
  }

  try {
    useAzureMonitor({
      azureMonitorExporterOptions: { connectionString },
      samplingRatio: 1.0,
      enableLiveMetrics: true
    })
  } catch (cause) {
    throw new TelemetryInitError('Error initializing Azure Monitor', cause)
  }

  return 'enabled'
}

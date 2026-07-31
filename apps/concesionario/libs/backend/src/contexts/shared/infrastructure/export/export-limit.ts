// Defensive cap shared by every resource export: rows are materialized in memory, so an oversized
// dataset is rejected (ExportTooLargeError) instead of exhausting the process. SAP volumes are modest
// today; crossing this calls for streaming, not a bigger number (see spec 22 DESIGN risks).
export const EXPORT_ROW_LIMIT = 50000

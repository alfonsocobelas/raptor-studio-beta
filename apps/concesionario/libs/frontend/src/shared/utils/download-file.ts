// Triggers a browser download for a blob via a synthetic anchor. Shared by the client-side CSV export
// (DataTable) and the server-side export flow (host components downloading the API response).
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

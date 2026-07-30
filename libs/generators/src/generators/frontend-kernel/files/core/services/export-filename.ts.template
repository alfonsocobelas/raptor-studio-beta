// Reads the download filename from a Content-Disposition header, falling back when it is absent
// (e.g. the header is not exposed cross-origin). Shared by every resource export service.
export function parseContentDispositionFilename(disposition: string | null, fallback: string): string {
  const match = disposition ? /filename="?([^"]+)"?/.exec(disposition) : null
  return match ? match[1] : fallback
}

// Domain port for binary file storage. Infrastructure provides the concrete adapter
// (Azure Blob Storage). The QBR module stores/retrieves evidence blobs through this port,
// so the browser never sees storage URLs or credentials.
export abstract class FileStoragePort {
  abstract upload(key: string, content: Buffer, mimeType: string): Promise<void>
  abstract download(key: string): Promise<Buffer>
  abstract delete(key: string): Promise<void>
}

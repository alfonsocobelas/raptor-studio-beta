// Stable port for binary file storage (ADR-004 catalog). Adapters live one lib per
// provider (storage-azure, storage-s3, …) and are selected in the app's composition root.
// The port is the least common denominator across providers; provider-specific abilities
// go in optional capability interfaces, never here.
export abstract class FileStoragePort {
  abstract upload(key: string, content: Buffer, mimeType: string): Promise<void>
  abstract download(key: string): Promise<Buffer>
  abstract delete(key: string): Promise<void>
}

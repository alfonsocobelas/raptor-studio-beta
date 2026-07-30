import { Bucket, Storage, StorageOptions } from '@google-cloud/storage'
import { FileStoragePort } from '@acc/infra-ports'

export interface GcsFileStorageOptions {
  bucket: string
  /** Passed through to the GCS client (projectId, keyFilename, apiEndpoint for fake-gcs-server…) */
  client?: StorageOptions
}

/**
 * Google Cloud Storage adapter for the FileStoragePort — third provider of the trio
 * (Azure Blob · S3-compatible · GCS). Cheap by design: the port was already validated
 * by the second adapter (ADR-004 rule of two).
 */
export class GcsFileStorage extends FileStoragePort {
  private readonly bucket: Bucket

  constructor(options: GcsFileStorageOptions, storage?: Storage) {
    super()
    this.bucket = (storage ?? new Storage(options.client)).bucket(options.bucket)
  }

  async upload(key: string, content: Buffer, mimeType: string): Promise<void> {
    await this.bucket.file(key).save(content, { contentType: mimeType, resumable: false })
  }

  async download(key: string): Promise<Buffer> {
    const [contents] = await this.bucket.file(key).download()
    return contents
  }

  async delete(key: string): Promise<void> {
    await this.bucket.file(key).delete()
  }
}

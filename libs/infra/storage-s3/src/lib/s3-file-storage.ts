import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { FileStoragePort } from '@raptor/infra-ports'

export interface S3FileStorageOptions {
  bucket: string
  /**
   * S3-compatible endpoint. Omit for AWS S3; set it for Cloudflare R2
   * (https://<account>.r2.cloudflarestorage.com) or local MinIO (http://localhost:9000).
   */
  endpoint?: string
  region?: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
  /** Path-style addressing, required by MinIO and some S3-compatibles */
  forcePathStyle?: boolean
}

/**
 * S3-compatible adapter for the FileStoragePort: one adapter covers AWS S3,
 * Cloudflare R2 and MinIO (conformance suite runs against MinIO in docker).
 * Second real provider of the catalog — it validates the port (ADR-004 rule of two).
 */
export class S3FileStorage extends FileStoragePort {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(options: S3FileStorageOptions, client?: S3Client) {
    super()
    this.bucket = options.bucket
    const config: S3ClientConfig = {
      region: options.region ?? 'auto',
      ...(options.endpoint && { endpoint: options.endpoint }),
      ...(options.credentials && { credentials: options.credentials }),
      ...(options.forcePathStyle !== undefined && { forcePathStyle: options.forcePathStyle })
    }
    this.client = client ?? new S3Client(config)
  }

  async upload(key: string, content: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: content, ContentType: mimeType })
    )
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    const bytes = await result.Body?.transformToByteArray()
    if (!bytes) throw new Error(`Empty body downloading key [${key}] from bucket [${this.bucket}]`)
    return Buffer.from(bytes)
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}

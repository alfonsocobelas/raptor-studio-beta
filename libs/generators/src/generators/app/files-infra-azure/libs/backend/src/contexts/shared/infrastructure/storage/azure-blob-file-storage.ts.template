import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { FileStoragePort } from '../../domain/storage/file-storage.port'

/**
 * Azure Blob Storage adapter for the FileStoragePort. Opens a single ContainerClient
 * from the configured connection string and stores/retrieves blobs by key. The QBR
 * module uses it to keep evidence binaries; the browser never sees Azure URLs.
 */
@Injectable()
export class AzureBlobFileStorage extends FileStoragePort {
  private readonly container: ContainerClient

  constructor(configService: ConfigService) {
    super()
    const connectionString = configService.get<string>('storage.connectionString') ?? ''
    const containerName = configService.get<string>('storage.container') ?? ''
    this.container = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(containerName)
  }

  async upload(key: string, content: Buffer, mimeType: string): Promise<void> {
    // Self-provision the container: idempotent no-op when it already exists (prod), and it lets
    // a fresh Azurite (local) accept the first upload without a manual container-creation step.
    await this.container.createIfNotExists()
    const blob = this.container.getBlockBlobClient(key)
    await blob.uploadData(content, { blobHTTPHeaders: { blobContentType: mimeType } })
  }

  async download(key: string): Promise<Buffer> {
    return this.container.getBlockBlobClient(key).downloadToBuffer()
  }

  async delete(key: string): Promise<void> {
    await this.container.getBlockBlobClient(key).delete()
  }
}

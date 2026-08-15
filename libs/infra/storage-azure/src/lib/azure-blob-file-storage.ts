import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { FileStoragePort } from '@raptor/infra-ports'

export interface AzureBlobFileStorageOptions {
  /** Azure Storage connection string; 'UseDevelopmentStorage=true' targets local Azurite */
  connectionString: string
  container: string
}

/**
 * Azure Blob Storage adapter for the FileStoragePort (extracted from the sap-licenses
 * reference). Framework-free on purpose: the app's composition root wires it, e.g. in Nest
 * `{ provide: FileStoragePort, useFactory: cfg => new AzureBlobFileStorage({...}) }`.
 */
export class AzureBlobFileStorage extends FileStoragePort {
  private readonly container: ContainerClient

  constructor(options: AzureBlobFileStorageOptions) {
    super()
    this.container = BlobServiceClient.fromConnectionString(options.connectionString).getContainerClient(
      options.container
    )
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

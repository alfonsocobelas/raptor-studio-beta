import * as storageBlob from '@azure/storage-blob'
import { AzureBlobFileStorage } from './azure-blob-file-storage'

// SDK mocked: the real @azure/storage-blob is never hit. jest hoists the factory above
// the module body, so the handles live *inside* the factory and are re-exported under
// `__mocks` for the assertions (the production code only ever touches BlobServiceClient).
jest.mock('@azure/storage-blob', () => {
  const uploadData = jest.fn()
  const downloadToBuffer = jest.fn()
  const del = jest.fn()
  const createIfNotExists = jest.fn()
  const getBlockBlobClient = jest.fn(() => ({ uploadData, downloadToBuffer, delete: del }))
  const getContainerClient = jest.fn(() => ({ getBlockBlobClient, createIfNotExists }))
  const fromConnectionString = jest.fn(() => ({ getContainerClient }))
  return {
    __esModule: true,
    BlobServiceClient: { fromConnectionString },
    __mocks: {
      fromConnectionString,
      getContainerClient,
      getBlockBlobClient,
      createIfNotExists,
      uploadData,
      downloadToBuffer,
      del
    }
  }
})

interface SdkMocks {
  fromConnectionString: jest.Mock
  getContainerClient: jest.Mock
  getBlockBlobClient: jest.Mock
  createIfNotExists: jest.Mock
  uploadData: jest.Mock
  downloadToBuffer: jest.Mock
  del: jest.Mock
}

const sdk = (storageBlob as unknown as { __mocks: SdkMocks }).__mocks

const OPTIONS = { connectionString: 'UseDevelopmentStorage=true', container: 'evidences' }

describe('AzureBlobFileStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('construction', () => {
    it('opens the container from the configured connection string and container name', () => {
      // WHEN
      new AzureBlobFileStorage(OPTIONS)

      // THEN
      expect(sdk.fromConnectionString).toHaveBeenCalledWith('UseDevelopmentStorage=true')
      expect(sdk.getContainerClient).toHaveBeenCalledWith('evidences')
    })
  })

  describe('upload', () => {
    it('uploads the buffer to the block blob named by the key, with the content type', async () => {
      // GIVEN
      const storage = new AzureBlobFileStorage(OPTIONS)
      const content = Buffer.from('evidence-bytes')

      // WHEN
      await storage.upload('01890-key', content, 'application/pdf')

      // THEN
      expect(sdk.getBlockBlobClient).toHaveBeenCalledWith('01890-key')
      expect(sdk.uploadData).toHaveBeenCalledWith(content, {
        blobHTTPHeaders: { blobContentType: 'application/pdf' }
      })
    })

    it('ensures the container exists before uploading (self-provisioning, idempotent)', async () => {
      // GIVEN
      const storage = new AzureBlobFileStorage(OPTIONS)

      // WHEN
      await storage.upload('01890-key', Buffer.from('x'), 'application/pdf')

      // THEN
      expect(sdk.createIfNotExists).toHaveBeenCalled()
    })
  })

  describe('download', () => {
    it('returns the buffer downloaded from the block blob named by the key', async () => {
      // GIVEN
      const storage = new AzureBlobFileStorage(OPTIONS)
      const downloaded = Buffer.from('downloaded-bytes')
      sdk.downloadToBuffer.mockResolvedValueOnce(downloaded)

      // WHEN
      const result = await storage.download('01890-key')

      // THEN
      expect(sdk.getBlockBlobClient).toHaveBeenCalledWith('01890-key')
      expect(result).toBe(downloaded)
    })
  })

  describe('delete', () => {
    it('deletes the block blob named by the key', async () => {
      // GIVEN
      const storage = new AzureBlobFileStorage(OPTIONS)

      // WHEN
      await storage.delete('01890-key')

      // THEN
      expect(sdk.getBlockBlobClient).toHaveBeenCalledWith('01890-key')
      expect(sdk.del).toHaveBeenCalled()
    })
  })
})

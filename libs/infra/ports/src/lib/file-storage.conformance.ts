import { FileStoragePort } from './file-storage.port'

/**
 * Conformance suite for FileStoragePort (ADR-004: every adapter must pass it before
 * entering the catalog). Call it from an adapter's integration test with a factory
 * bound to a real backend (Azurite, MinIO, …); it registers the shared contract tests.
 *
 * Unit tests with mocked SDKs do NOT replace this suite: conformance is about the
 * observable behavior against a live backend being equivalent across providers.
 */
export function describeFileStorageConformance(adapterName: string, factory: () => Promise<FileStoragePort>): void {
  describe(`FileStoragePort conformance — ${adapterName}`, () => {
    let storage: FileStoragePort

    beforeAll(async () => {
      storage = await factory()
    })

    it('round-trips content through upload and download', async () => {
      const key = `conformance-${Date.now()}-roundtrip`
      const content = Buffer.from('conformance-bytes')

      await storage.upload(key, content, 'application/octet-stream')
      const downloaded = await storage.download(key)

      expect(downloaded.equals(content)).toBe(true)
      await storage.delete(key)
    })

    it('overwrites content on re-upload of the same key', async () => {
      const key = `conformance-${Date.now()}-overwrite`

      await storage.upload(key, Buffer.from('first'), 'text/plain')
      await storage.upload(key, Buffer.from('second'), 'text/plain')
      const downloaded = await storage.download(key)

      expect(downloaded.toString()).toBe('second')
      await storage.delete(key)
    })

    it('rejects the download of a deleted key', async () => {
      const key = `conformance-${Date.now()}-deleted`

      await storage.upload(key, Buffer.from('bye'), 'text/plain')
      await storage.delete(key)

      await expect(storage.download(key)).rejects.toBeDefined()
    })
  })
}

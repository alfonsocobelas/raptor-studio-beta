import { describeFileStorageConformance } from '@acc/infra/ports'
import { AzureBlobFileStorage } from './azure-blob-file-storage'

// Conformidad contra Azurite real (make docker-local-start). Activar con INTEGRATION=1.
if (process.env['INTEGRATION']) {
  describeFileStorageConformance(
    'AzureBlobFileStorage (Azurite)',
    async () => new AzureBlobFileStorage({ connectionString: 'UseDevelopmentStorage=true', container: 'conformance' })
  )
} else {
  describe.skip('FileStoragePort conformance — AzureBlobFileStorage (requiere INTEGRATION=1 + Azurite)', () => {
    it('skipped', () => undefined)
  })
}

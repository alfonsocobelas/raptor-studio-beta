import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { describeFileStorageConformance } from '@raptor/infra-ports'
import { S3FileStorage } from './s3-file-storage'

// Conformidad contra MinIO real (make docker-local-start). Activar con INTEGRATION=1.
if (process.env['INTEGRATION']) {
  describeFileStorageConformance('S3FileStorage (MinIO)', async () => {
    const options = {
      bucket: 'conformance',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
      forcePathStyle: true
    }
    const client = new S3Client({ ...options, endpoint: options.endpoint })
    await client.send(new CreateBucketCommand({ Bucket: options.bucket })).catch(() => undefined)
    return new S3FileStorage(options)
  })
} else {
  describe.skip('FileStoragePort conformance — S3FileStorage (requiere INTEGRATION=1 + MinIO)', () => {
    it('skipped', () => undefined)
  })
}

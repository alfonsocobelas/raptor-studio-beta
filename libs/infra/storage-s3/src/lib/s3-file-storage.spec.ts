import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { S3FileStorage } from './s3-file-storage'

const send = jest.fn()
const client = { send } as unknown as S3Client

describe('S3FileStorage', () => {
  beforeEach(() => send.mockReset())

  it('uploads the buffer with bucket, key and content type', async () => {
    const storage = new S3FileStorage({ bucket: 'evidences' }, client)
    const content = Buffer.from('bytes')

    await storage.upload('key-1', content, 'application/pdf')

    const command = send.mock.calls[0][0] as PutObjectCommand
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect(command.input).toMatchObject({ Bucket: 'evidences', Key: 'key-1', ContentType: 'application/pdf' })
  })

  it('downloads and returns the body as Buffer', async () => {
    send.mockResolvedValueOnce({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } })
    const storage = new S3FileStorage({ bucket: 'evidences' }, client)

    const result = await storage.download('key-1')

    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand)
    expect([...result]).toEqual([1, 2, 3])
  })

  it('throws a readable error when the body is empty', async () => {
    send.mockResolvedValueOnce({ Body: undefined })
    const storage = new S3FileStorage({ bucket: 'evidences' }, client)

    await expect(storage.download('missing')).rejects.toThrow('Empty body downloading key [missing]')
  })

  it('deletes by bucket and key', async () => {
    const storage = new S3FileStorage({ bucket: 'evidences' }, client)

    await storage.delete('key-1')

    const command = send.mock.calls[0][0] as DeleteObjectCommand
    expect(command).toBeInstanceOf(DeleteObjectCommand)
    expect(command.input).toMatchObject({ Bucket: 'evidences', Key: 'key-1' })
  })
})

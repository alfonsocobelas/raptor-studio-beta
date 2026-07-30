import { Storage } from '@google-cloud/storage'
import { GcsFileStorage } from './gcs-file-storage'

const save = jest.fn()
const download = jest.fn()
const del = jest.fn()
const file = jest.fn(() => ({ save, download, delete: del }))
const bucket = jest.fn(() => ({ file }))
const storage = { bucket } as unknown as Storage

describe('GcsFileStorage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('opens the configured bucket', () => {
    new GcsFileStorage({ bucket: 'evidences' }, storage)

    expect(bucket).toHaveBeenCalledWith('evidences')
  })

  it('uploads with content type and non-resumable mode', async () => {
    const adapter = new GcsFileStorage({ bucket: 'evidences' }, storage)
    const content = Buffer.from('bytes')

    await adapter.upload('key-1', content, 'application/pdf')

    expect(file).toHaveBeenCalledWith('key-1')
    expect(save).toHaveBeenCalledWith(content, { contentType: 'application/pdf', resumable: false })
  })

  it('downloads returning the buffer', async () => {
    download.mockResolvedValueOnce([Buffer.from('data')])
    const adapter = new GcsFileStorage({ bucket: 'evidences' }, storage)

    const result = await adapter.download('key-1')

    expect(result.toString()).toBe('data')
  })

  it('deletes by key', async () => {
    const adapter = new GcsFileStorage({ bucket: 'evidences' }, storage)

    await adapter.delete('key-1')

    expect(file).toHaveBeenCalledWith('key-1')
    expect(del).toHaveBeenCalled()
  })
})

import { BadRequestException } from '@nestjs/common'
import { StudioFillController } from '@app/backend/contexts/studio/generate/studio-fill.controller'

/**
 * Spec 45 TASK-02: el cinturón del endpoint de relleno — solo directorios DENTRO del
 * workspace y existentes. El streaming se cubre con describeFillLine (puro) y la
 * validación en vivo; aquí lo que nunca debe pasar.
 */
describe('StudioFillController — el cinturón del directorio', () => {
  const controller = new StudioFillController()
  const res = { setHeader: () => undefined } as never

  it('rechaza rutas que escapan del workspace', async () => {
    await expect(controller.stream({ directory: '../fuera' }, res)).rejects.toThrow(BadRequestException)
    await expect(controller.stream({ directory: 'apps/../../etc' }, res)).rejects.toThrow(BadRequestException)
  })

  it('rechaza un directorio que no existe', async () => {
    await expect(controller.stream({ directory: 'apps/no-existe-jamas' }, res)).rejects.toThrow(/no existe/)
  })
})

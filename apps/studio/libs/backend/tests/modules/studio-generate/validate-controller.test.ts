import { BadRequestException } from '@nestjs/common'
import { StudioValidateController } from '@app/backend/contexts/studio/generate/studio-validate.controller'

/**
 * Spec 75 TASK-04: el cinturón del endpoint de validación — solo directorios DENTRO del
 * workspace y existentes, como el relleno. La orquestación se cubre con runValidation
 * (pura); aquí lo que nunca debe pasar.
 */
describe('StudioValidateController — el cinturón del directorio', () => {
  const controller = new StudioValidateController()
  const res = { setHeader: () => undefined } as never

  it('rechaza rutas que escapan del workspace', async () => {
    await expect(controller.stream({ directory: '../fuera' }, res)).rejects.toThrow(BadRequestException)
    await expect(controller.stream({ directory: 'apps/../../etc' }, res)).rejects.toThrow(BadRequestException)
  })

  it('rechaza un directorio que no existe', async () => {
    await expect(controller.stream({ directory: 'apps/no-existe-jamas' }, res)).rejects.toThrow(/no existe/)
  })
})

import { BadRequestException } from '@nestjs/common'
import { StudioRepairController } from '@app/backend/contexts/studio/generate/studio-repair.controller'

/**
 * Spec 75 TASK-05: el cinturón del endpoint de reparación — solo directorios DENTRO del
 * workspace y existentes, y sin informe no hay nada que reparar. El ciclo real (re-proponer
 * bajo gate solo dentro de los huecos) vive en el generador fill-flow-slots --repair.
 */
describe('StudioRepairController — el cinturón', () => {
  const controller = new StudioRepairController()
  const res = { setHeader: () => undefined } as never

  it('rechaza rutas que escapan del workspace', async () => {
    await expect(controller.stream({ directory: '../fuera', report: 'FAIL x' }, res)).rejects.toThrow(BadRequestException)
    await expect(controller.stream({ directory: 'apps/../../etc', report: 'FAIL x' }, res)).rejects.toThrow(
      BadRequestException
    )
  })

  it('rechaza un directorio que no existe', async () => {
    await expect(controller.stream({ directory: 'apps/no-existe-jamas', report: 'FAIL x' }, res)).rejects.toThrow(
      /no existe/
    )
  })

  it('rechaza un informe vacío: sin fallo que citar no hay reparación que acotar', async () => {
    await expect(controller.stream({ directory: 'apps', report: '   ' }, res)).rejects.toThrow(/informe/i)
  })
})

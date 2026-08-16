import { v7 as uuidv7 } from 'uuid'
import { GetMuestraUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/get-muestra-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('GetMuestraUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: GetMuestraUseCase

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new GetMuestraUseCase(repositoryMock)
  })

  describe('given the muestra exists', () => {
    it('returns its primitives', async () => {
      const muestra = MuestraMother.random()
      repositoryMock.givenFound(muestra)

      const result = await useCase.invoke({ id: muestra.id.value })

      expect(result).toEqual(muestra.toPrimitives())
    })
  })

  describe('given the muestra does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
